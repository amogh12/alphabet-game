const TRACE_ROUNDS = 5;
const BRUSH_COLORS = ['#FF6B6B','#FF8C42','#A569BD','#2E86C1','#28B463'];
const COVERAGE_THRESHOLD = 0.75;

let traceQueue = [], traceRoundNum = 0, currentTraceWord = null, currentLetterIdx = 0;
let letterPixelSet = null, coverageCount = 0, coveredSet = new Set();
let traceCanvas = null, traceCtx = null, canvasSize = 280;
let isTracing = false, lastTX, lastTY, letterDone = false;

function initTraceCanvas() {
  traceCanvas = document.getElementById('trace-canvas');
  const wrap = document.getElementById('trace-canvas-wrap');
  canvasSize = wrap.offsetWidth || 280;
  const dpr = window.devicePixelRatio || 1;
  traceCanvas.width  = Math.round(canvasSize * dpr);
  traceCanvas.height = Math.round(canvasSize * dpr);
  traceCanvas.style.width  = canvasSize + 'px';
  traceCanvas.style.height = canvasSize + 'px';
  traceCtx = traceCanvas.getContext('2d');
  traceCtx.scale(dpr, dpr);

  traceCanvas.addEventListener('touchstart', onTraceStart, {passive: false});
  traceCanvas.addEventListener('touchmove',  onTraceMove,  {passive: false});
  traceCanvas.addEventListener('touchend',   onTraceEnd,   {passive: false});
  traceCanvas.addEventListener('mousedown',  onTraceStart);
  traceCanvas.addEventListener('mousemove',  e => { if (e.buttons === 1) onTraceMove(e); });
  traceCanvas.addEventListener('mouseup',    onTraceEnd);
  traceCanvas.addEventListener('mouseleave', onTraceEnd);
}

function drawGhostLetter(letter) {
  const S = canvasSize, fs = S * 0.76;
  traceCtx.clearRect(0, 0, S, S);
  traceCtx.save();
  traceCtx.font = `bold ${fs}px 'Fredoka One', cursive`;
  traceCtx.textAlign = 'center';
  traceCtx.textBaseline = 'middle';
  traceCtx.fillStyle = 'rgba(180,180,180,0.28)';
  traceCtx.fillText(letter, S / 2, S / 2);
  traceCtx.restore();
}

function buildLetterPixelSet(letter) {
  const S = canvasSize, fs = S * 0.76;
  const off = document.createElement('canvas');
  off.width = S; off.height = S;
  const octx = off.getContext('2d');
  octx.font = `bold ${fs}px 'Fredoka One', cursive`;
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  octx.fillStyle = '#000';
  octx.fillText(letter, S / 2, S / 2);
  const data = octx.getImageData(0, 0, S, S).data;
  const set = new Set();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 80) set.add(i >> 2);
  }
  return set;
}

function setupTraceLetter() {
  const letter = currentTraceWord.word[currentLetterIdx];
  coverageCount = 0; coveredSet = new Set(); letterDone = false;
  isTracing = false; lastTX = lastTY = undefined;

  drawGhostLetter(letter);
  letterPixelSet = buildLetterPixelSet(letter);

  document.getElementById('trace-current-letter').textContent = letter;
  document.getElementById('trace-coverage-bar').style.width      = '0%';
  document.getElementById('trace-coverage-bar').style.background = '';
  document.getElementById('trace-instruction').textContent = `Draw over the letter ${letter}!`;

  updateTraceWordDisplay();
  sayLetter(letter);
}

function updateTraceWordDisplay() {
  const word = currentTraceWord.word;
  const container = document.getElementById('trace-word-display');
  container.innerHTML = '';
  for (let i = 0; i < word.length; i++) {
    const span = document.createElement('span');
    span.className = 'twl' + (i < currentLetterIdx ? ' done' : i === currentLetterIdx ? ' current' : '');
    span.textContent = word[i];
    container.appendChild(span);
  }
}

function updateTraceDots() {
  const el = document.getElementById('trace-word-dots');
  el.innerHTML = '';
  for (let i = 0; i < TRACE_ROUNDS; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i < traceRoundNum ? ' done' : i === traceRoundNum ? ' current' : '');
    el.appendChild(d);
  }
}

function getCanvasPos(e) {
  const rect = traceCanvas.getBoundingClientRect();
  const src  = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - rect.left) * canvasSize / rect.width,
    y: (src.clientY - rect.top)  * canvasSize / rect.height,
  };
}

function paintBrush(x, y) {
  const color = BRUSH_COLORS[currentLetterIdx % BRUSH_COLORS.length];
  const R = Math.round(canvasSize * 0.088);
  if (lastTX !== undefined) {
    traceCtx.beginPath();
    traceCtx.moveTo(lastTX, lastTY);
    traceCtx.lineTo(x, y);
    traceCtx.strokeStyle = color + 'B8';
    traceCtx.lineWidth = R * 2;
    traceCtx.lineCap = 'round';
    traceCtx.lineJoin = 'round';
    traceCtx.stroke();
  } else {
    traceCtx.beginPath();
    traceCtx.arc(x, y, R, 0, Math.PI * 2);
    traceCtx.fillStyle = color + 'B8';
    traceCtx.fill();
  }
}

function markCoverage(cx, cy) {
  if (!letterPixelSet) return;
  const S = canvasSize, R = Math.round(S * 0.088);
  const ix = Math.round(cx), iy = Math.round(cy);
  for (let dx = -R; dx <= R; dx++) {
    for (let dy = -R; dy <= R; dy++) {
      if (dx * dx + dy * dy <= R * R) {
        const px = ix + dx, py = iy + dy;
        if (px >= 0 && px < S && py >= 0 && py < S) {
          const key = py * S + px;
          if (!coveredSet.has(key)) {
            coveredSet.add(key);
            if (letterPixelSet.has(key)) coverageCount++;
          }
        }
      }
    }
  }
  const pct = letterPixelSet.size > 0 ? coverageCount / letterPixelSet.size : 0;
  document.getElementById('trace-coverage-bar').style.width = Math.min(pct * 100, 100) + '%';
  if (pct >= COVERAGE_THRESHOLD && !letterDone) {
    letterDone = true;
    onLetterComplete();
  }
}

function onTraceStart(e) {
  e.preventDefault();
  if (!traceCtx || letterDone) return;
  isTracing = true;
  const {x, y} = getCanvasPos(e);
  lastTX = lastTY = undefined;
  paintBrush(x, y); markCoverage(x, y);
  lastTX = x; lastTY = y;
}
function onTraceMove(e) {
  e.preventDefault();
  if (!isTracing || letterDone) return;
  const {x, y} = getCanvasPos(e);
  paintBrush(x, y); markCoverage(x, y);
  lastTX = x; lastTY = y;
}
function onTraceEnd(e) { e.preventDefault(); isTracing = false; lastTX = lastTY = undefined; }

function onLetterComplete() {
  playSound('letter-done');
  const S = canvasSize;
  traceCtx.save();
  traceCtx.globalAlpha = 0.25;
  traceCtx.fillStyle = '#5CB85C';
  traceCtx.beginPath();
  traceCtx.roundRect(0, 0, S, S, 24);
  traceCtx.fill();
  traceCtx.restore();
  document.getElementById('trace-instruction').textContent = '✅ Great!';
  document.getElementById('trace-coverage-bar').style.width      = '100%';
  document.getElementById('trace-coverage-bar').style.background = '#5CB85C';

  currentLetterIdx++;
  updateTraceWordDisplay();

  if (currentLetterIdx >= currentTraceWord.word.length) {
    setTimeout(onWordComplete, 700);
  } else {
    setTimeout(setupTraceLetter, 900);
  }
}

function onWordComplete() {
  playSound('correct'); spawnConfetti(); sayWord(currentTraceWord.word);
  traceRoundNum++;
  const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
  showFeedbackOverlay(p[0], p[1],
    `You traced "${currentTraceWord.word}"! ${currentTraceWord.emoji}`,
    '#FF6B6B', 2000, () => {
      if (traceRoundNum >= TRACE_ROUNDS) showEndTrace();
      else nextTraceWord();
    });
}

function showEndTrace() {
  playSound('fanfare'); spawnConfetti(); spawnConfetti();
  showFeedbackOverlay('🎓', `You traced ${TRACE_ROUNDS} words! 🌟`,
    'Amazing reader! Keep it up! 🏆', '#FF6B6B', 3500, restartTraceGame);
}

function nextTraceWord() {
  currentTraceWord = traceQueue[traceRoundNum];
  currentLetterIdx = 0;
  document.getElementById('trace-word-emoji').textContent = currentTraceWord.emoji;
  updateTraceDots();
  setupTraceLetter();
}

function restartTraceGame() {
  traceRoundNum = 0; currentLetterIdx = 0;
  traceQueue = shuffle([...TRACE_WORDS]).slice(0, TRACE_ROUNDS);
  document.fonts.ready.then(() => {
    if (!traceCanvas || !traceCtx) initTraceCanvas();
    nextTraceWord();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('trace-clear-btn').addEventListener('click', () => {
    if (letterDone) return;
    coverageCount = 0; coveredSet = new Set();
    document.getElementById('trace-coverage-bar').style.width = '0%';
    drawGhostLetter(currentTraceWord.word[currentLetterIdx]);
  });

  restartTraceGame();
});
