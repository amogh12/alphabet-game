const ROUNDS = 8;
let queue = [], current = null, score = 0, roundNum = 0, wrongCount = 0;

const SHAPES = [
  { id: 'circle',    label: 'circle',    emoji: '⭕' },
  { id: 'square',    label: 'square',    emoji: '🟦' },
  { id: 'triangle',  label: 'triangle',  emoji: '🔺' },
  { id: 'star',      label: 'star',      emoji: '⭐' },
  { id: 'rectangle', label: 'rectangle', emoji: '🟩' },
  { id: 'heart',     label: 'heart',     emoji: '❤️' },
  { id: 'diamond',   label: 'diamond',   emoji: '💎' },
];

const SHAPE_COLORS = ['#FF6B6B', '#2E86C1', '#28B463', '#9B59B6'];

// 4 slots — one per bubble
const SLOTS = [
  { top: 4,  left: 8  },
  { top: 4,  left: 58 },
  { top: 54, left: 8  },
  { top: 54, left: 58 },
];

function makeShapeSVG(shapeId, color, size) {
  const s = size || 60;
  const paths = {
    circle:    `<circle cx="50" cy="50" r="42" fill="${color}"/>`,
    square:    `<rect x="6" y="6" width="88" height="88" rx="12" fill="${color}"/>`,
    triangle:  `<polygon points="50,6 94,90 6,90" fill="${color}"/>`,
    star:      `<polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="${color}"/>`,
    rectangle: `<rect x="8" y="22" width="84" height="56" rx="8" fill="${color}"/>`,
    heart:     `<path d="M50,78 C50,78 12,54 12,30 C12,16 22,7 35,7 C42,7 48,11 50,17 C52,11 58,7 65,7 C78,7 88,16 88,30 C88,54 50,78 50,78Z" fill="${color}"/>`,
    diamond:   `<polygon points="50,4 96,50 50,96 4,50" fill="${color}"/>`,
  };
  return `<svg viewBox="0 0 100 100" width="${s}" height="${s}" aria-hidden="true">${paths[shapeId] || ''}</svg>`;
}

function sayShapeTwice(label) {
  if (!soundEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const speak = () => {
    const u = new SpeechSynthesisUtterance(label);
    u.rate = 0.85; u.pitch = 1.3; u.volume = 1;
    return u;
  };
  const u1 = speak();
  u1.onend = () => setTimeout(() => window.speechSynthesis.speak(speak()), 700);
  window.speechSynthesis.speak(u1);
}

function animateSoundBtn() {
  const btn = document.getElementById('shape-pop-sound-btn');
  if (!btn) return;
  btn.classList.remove('sound-pop'); void btn.offsetWidth; btn.classList.add('sound-pop');
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

  animateSoundBtn();
  sayShapeTwice(current.label);

  const area = document.getElementById('shape-pop-area');
  area.innerHTML = '';
  const slots = shuffle([...SLOTS]);
  // 4 bubbles: correct + 3 random distractors
  const pool = SHAPES.filter(s => s.id !== current.id);
  shuffle(pool);
  const allShapes = shuffle([current, ...pool.slice(0, 3)]);

  allShapes.forEach((shape, i) => {
    const slot = slots[i];
    const top  = slot.top  + (Math.random() * 4 - 2);
    const left = slot.left + (Math.random() * 4 - 2);
    const color = SHAPE_COLORS[i % SHAPE_COLORS.length];
    const dur   = (2.5 + Math.random() * 1.5).toFixed(2);
    const delay = (Math.random() * 2).toFixed(2);

    const btn = document.createElement('button');
    btn.className = 'shape-pop-bubble';
    btn.dataset.shapeId = shape.id;
    btn.setAttribute('aria-label', `${shape.label} bubble`);
    btn.style.cssText = `top:${top}%; left:${left}%; --dur:${dur}s; --delay:-${delay}s;`;
    btn.innerHTML = makeShapeSVG(shape.id, color, 58);
    btn.addEventListener('click', () => handlePop(btn, shape));
    area.appendChild(btn);
  });

  buildProgress();
}

function handlePop(btn, shape) {
  if (btn.disabled || btn.classList.contains('wrong') || btn.classList.contains('popped')) return;

  if (shape.id === current.id) {
    btn.classList.add('popped');
    document.querySelectorAll('.shape-pop-bubble').forEach(b => b.disabled = true);
    score++;
    document.getElementById('score').textContent = score;
    hideTryAgainMsg(); hideHint();
    playSound('correct'); spawnConfetti();
    const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    roundNum++;
    setTimeout(() => {
      showFeedbackOverlay(p[0], p[1], `${current.emoji} Yes! That's a ${current.label}!`, '#16A085', 1800, nextQuestion);
    }, 400);
  } else {
    btn.classList.add('wrong');
    btn.disabled = true;
    wrongCount++; playSound('wrong'); showTryAgainMsg();
    if (wrongCount >= 1) showHint();
    if (wrongCount >= 2) activateHint();
  }
}

function showEnd() {
  playSound('fanfare'); spawnConfetti(); spawnConfetti();
  const stars = score >= ROUNDS ? '🌟🌟🌟' : score >= Math.ceil(ROUNDS * 0.7) ? '⭐⭐⭐' : score >= Math.ceil(ROUNDS * 0.5) ? '⭐⭐' : '⭐';
  showFeedbackOverlay('🔷', `${stars} ${score}/${ROUNDS}`,
    score === ROUNDS ? 'You know all the shapes! 🏆' : 'Great popping! Play again! 🔄',
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
  document.querySelectorAll('.shape-pop-bubble.hint-glow').forEach(b => b.classList.remove('hint-glow'));
}
function activateHint() {
  playSound('hint');
  animateSoundBtn(); sayShapeTwice(current.label);
  document.querySelectorAll('.shape-pop-bubble').forEach(btn => {
    if (!btn.disabled && btn.dataset.shapeId === current.id)
      btn.classList.add('hint-glow');
  });
}

function restartGame() {
  score = 0; roundNum = 0;
  document.getElementById('score').textContent = 0;
  // 7 shapes — shuffle all, take 8 (one shape repeats)
  queue = shuffle([...SHAPES, ...SHAPES]).slice(0, ROUNDS);
  nextQuestion();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('hint-btn').addEventListener('click', () => { activateHint(); playSound('hint'); });
  document.getElementById('shape-pop-sound-btn').addEventListener('click', () => {
    if (!current) return;
    animateSoundBtn(); sayShapeTwice(current.label);
  });
  restartGame();
});
