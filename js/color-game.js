const ROUNDS = 8;
let queue = [], current = null, score = 0, roundNum = 0, wrongCount = 0;

const GAME_COLORS = [
  { name: 'red',    hex: '#E74C3C', shadow: '#C0392B' },
  { name: 'orange', hex: '#FF8C42', shadow: '#D4600A' },
  { name: 'yellow', hex: '#F4D03F', shadow: '#C9A800' },
  { name: 'green',  hex: '#28B463', shadow: '#1A7D44' },
  { name: 'blue',   hex: '#2E86C1', shadow: '#1A5F8E' },
  { name: 'purple', hex: '#9B59B6', shadow: '#703688' },
  { name: 'pink',   hex: '#FF69B4', shadow: '#C44F8A' },
  { name: 'teal',   hex: '#16A085', shadow: '#0D7061' },
];

const SLOTS = [
  { top: 5,  left: 5  },
  { top: 5,  left: 60 },
  { top: 42, left: 32 },
  { top: 72, left: 5  },
  { top: 72, left: 60 },
];

function sayColorTwice(colorName) {
  if (!soundEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const speak = () => {
    const u = new SpeechSynthesisUtterance(colorName);
    u.rate = 0.85; u.pitch = 1.3; u.volume = 1;
    return u;
  };

  const u1 = speak();
  u1.onend = () => setTimeout(() => window.speechSynthesis.speak(speak()), 700);
  window.speechSynthesis.speak(u1);
}

function animateSoundBtn() {
  const btn = document.getElementById('color-sound-btn');
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
  sayColorTwice(current.target.name);

  const area = document.getElementById('color-play-area');
  area.innerHTML = '';
  const slots = shuffle([...SLOTS]);

  shuffle([...current.choices]).forEach((color, i) => {
    const slot = slots[i];
    const top  = slot.top  + (Math.random() * 5 - 2.5);
    const left = slot.left + (Math.random() * 5 - 2.5);
    const dur   = (2.5 + Math.random() * 1.5).toFixed(2);
    const delay = (Math.random() * 2).toFixed(2);

    const btn = document.createElement('button');
    btn.className = 'color-bubble';
    btn.dataset.color = color.name;
    btn.setAttribute('aria-label', `${color.name} bubble`);
    btn.style.cssText =
      `top:${top}%; left:${left}%; background:${color.hex};` +
      `box-shadow: 0 6px 0 ${color.shadow};` +
      `--dur:${dur}s; --delay:-${delay}s;`;
    btn.addEventListener('click', () => handlePop(btn, color));
    area.appendChild(btn);
  });

  buildProgress();
}

function handlePop(btn, color) {
  if (btn.disabled || btn.classList.contains('wrong') || btn.classList.contains('popped')) return;

  if (color.name === current.target.name) {
    btn.classList.add('popped');
    document.querySelectorAll('.color-bubble').forEach(b => b.disabled = true);
    score++;
    document.getElementById('score').textContent = score;
    hideTryAgainMsg(); hideHint();
    playSound('correct'); spawnConfetti();
    const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    roundNum++;
    setTimeout(() => {
      showFeedbackOverlay(p[0], p[1], `${current.target.name} — you found it! 🌈`, current.target.hex, 1800, nextQuestion);
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
  showFeedbackOverlay('🌈', `${stars} ${score}/${ROUNDS}`,
    score === ROUNDS ? 'You know all the colors! 🏆' : 'Great colors! Play again! 🔄',
    '#9B59B6', 3500, restartGame);
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
  document.querySelectorAll('.color-bubble.hint-glow').forEach(b => b.classList.remove('hint-glow'));
}
function activateHint() {
  playSound('hint');
  animateSoundBtn(); sayColorTwice(current.target.name);
  document.querySelectorAll('.color-bubble').forEach(btn => {
    if (!btn.disabled && btn.dataset.color === current.target.name)
      btn.classList.add('hint-glow');
  });
}

function restartGame() {
  score = 0; roundNum = 0;
  document.getElementById('score').textContent = 0;
  const targets = shuffle([...GAME_COLORS]);
  queue = targets.slice(0, ROUNDS).map(target => {
    const distractors = GAME_COLORS.filter(c => c.name !== target.name);
    shuffle(distractors);
    return { target, choices: shuffle([target, ...distractors.slice(0, 4)]) };
  });
  nextQuestion();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('hint-btn').addEventListener('click', () => { activateHint(); playSound('hint'); });
  document.getElementById('color-sound-btn').addEventListener('click', () => {
    if (!current) return;
    animateSoundBtn(); sayColorTwice(current.target.name);
  });
  restartGame();
});
