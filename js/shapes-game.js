const ROUNDS = 8;
let queue = [], current = null, score = 0, roundNum = 0, wrongCount = 0;

const SHAPES = [
  { id: 'circle',   label: 'circle',   emoji: '⭕' },
  { id: 'square',   label: 'square',   emoji: '🟦' },
  { id: 'triangle', label: 'triangle', emoji: '🔺' },
  { id: 'star',     label: 'star',     emoji: '⭐' },
];

const SHAPE_COLORS = ['#FF6B6B','#2E86C1','#28B463','#9B59B6','#E67E22','#E91E8C'];

function makeShapeSVG(shapeId, color, size) {
  const s = size || 110;
  const paths = {
    circle:   `<circle cx="50" cy="50" r="42" fill="${color}"/>`,
    square:   `<rect x="6" y="6" width="88" height="88" rx="12" fill="${color}"/>`,
    triangle: `<polygon points="50,6 94,90 6,90" fill="${color}"/>`,
    star:     `<polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="${color}"/>`,
  };
  return `<svg viewBox="0 0 100 100" width="${s}" height="${s}" aria-hidden="true">${paths[shapeId] || ''}</svg>`;
}

function sayShapeName(label) {
  if (!soundEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(label);
  u.rate = 0.8; u.pitch = 1.2; u.volume = 1;
  window.speechSynthesis.speak(u);
}

function buildProgress() {
  const el = document.getElementById('progress');
  el.innerHTML = '';
  for (let i = 0; i < ROUNDS; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i < roundNum ? ' done' : i === roundNum ? ' current' : '');
    el.appendChild(d);
  }
}

function nextQuestion() {
  if (roundNum >= ROUNDS) { showEnd(); return; }
  wrongCount = 0;
  hideTryAgainMsg(); hideHint();

  current = queue[roundNum];
  document.getElementById('round').textContent = roundNum + 1;
  document.getElementById('shape-name-label').textContent = current.label;

  const displayColor = SHAPE_COLORS[roundNum % SHAPE_COLORS.length];
  const display = document.getElementById('shape-display');
  display.innerHTML = makeShapeSVG(current.id, displayColor, 110);
  display.classList.remove('pop'); void display.offsetWidth; display.classList.add('pop');

  setTimeout(() => sayShapeName(current.label), 300);

  // 4 answer buttons showing all 4 shapes; each uses a different color
  const options = shuffle([...SHAPES]);
  const container = document.getElementById('answers');
  container.innerHTML = '';
  options.forEach((shape, idx) => {
    const btnColor = SHAPE_COLORS[(roundNum + idx + 2) % SHAPE_COLORS.length];
    const btn = document.createElement('button');
    btn.className = 'answer-btn shape-answer-btn';
    btn.setAttribute('aria-label', shape.label);
    btn.dataset.shapeId = shape.id;
    btn.innerHTML = makeShapeSVG(shape.id, btnColor, 56) +
      `<span class="shape-btn-label">${shape.label}</span>`;
    btn.addEventListener('click', () => handleAnswer(btn, shape));
    container.appendChild(btn);
  });
  buildProgress();
}

function handleAnswer(btn, shape) {
  if (btn.disabled || btn.classList.contains('wrong') || btn.classList.contains('correct')) return;
  if (shape.id === current.id) {
    btn.classList.add('correct');
    document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);
    score++;
    document.getElementById('score').textContent = score;
    hideTryAgainMsg(); hideHint();
    spawnConfetti(); playSound('correct'); sayShapeName(current.label);
    const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    roundNum++;
    setTimeout(() => {
      showFeedbackOverlay(p[0], p[1], `${current.emoji} Yes! That's a ${current.label}!`, '#16A085', 1800, nextQuestion);
    }, 400);
  } else {
    btn.classList.add('wrong'); btn.disabled = true;
    wrongCount++; playSound('wrong'); showTryAgainMsg();
    if (wrongCount >= 1) showHint();
    if (wrongCount >= 2) activateHint();
  }
}

function showEnd() {
  playSound('fanfare'); spawnConfetti(); spawnConfetti();
  const stars = score >= ROUNDS ? '🌟🌟🌟' : score >= Math.ceil(ROUNDS * 0.7) ? '⭐⭐⭐' : score >= Math.ceil(ROUNDS * 0.5) ? '⭐⭐' : '⭐';
  showFeedbackOverlay('🔷', `${stars} ${score}/${ROUNDS}`,
    score === ROUNDS ? "You know all the shapes! 🏆" : 'Great job! Play again! 🔄',
    '#16A085', 3500, restartGame);
}

function showTryAgainMsg() {
  const el = document.getElementById('try-again-msg');
  el.textContent = ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)];
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}
function hideTryAgainMsg() { document.getElementById('try-again-msg').classList.remove('show'); }

function showHint() { document.getElementById('hint-btn').classList.add('visible'); }
function hideHint() {
  document.getElementById('hint-btn').classList.remove('visible');
  document.querySelectorAll('.answer-btn.hint-glow').forEach(b => b.classList.remove('hint-glow'));
}
function activateHint() {
  playSound('hint');
  document.querySelectorAll('.answer-btn').forEach(btn => {
    if (!btn.disabled && btn.dataset.shapeId === current.id) btn.classList.add('hint-glow');
  });
}

function restartGame() {
  score = 0; roundNum = 0;
  document.getElementById('score').textContent = 0;
  // Each shape appears twice across 8 rounds
  queue = shuffle([...SHAPES, ...SHAPES]).slice(0, ROUNDS);
  nextQuestion();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('hint-btn').addEventListener('click', () => { activateHint(); playSound('hint'); });
  document.getElementById('shape-display').addEventListener('click', () => {
    if (current) sayShapeName(current.label);
  });
  restartGame();
});
