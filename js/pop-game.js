const ROUNDS = 8;
let queue = [], current = null, score = 0, roundNum = 0, wrongCount = 0;

const BUBBLE_COLORS = [
  '#FF6B6B','#FF8C42','#F4D03F','#28B463',
  '#2E86C1','#9B59B6','#E91E8C','#16A085',
];

// 5 fixed slots (top/left as % of play area) — shuffled each round
const SLOTS = [
  { top: 5,  left: 5  },
  { top: 5,  left: 60 },
  { top: 42, left: 32 },
  { top: 72, left: 5  },
  { top: 72, left: 60 },
];

function sayNumber(n) {
  if (!soundEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(n));
  u.rate = 0.9; u.pitch = 1.3; u.volume = 1;
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

  // Show target number
  const tEl = document.getElementById('pop-target');
  tEl.textContent = current.target;
  tEl.style.color = COLORS[roundNum % COLORS.length];
  tEl.classList.remove('pop'); void tEl.offsetWidth; tEl.classList.add('pop');

  setTimeout(() => sayNumber(current.target), 300);

  // Render bubbles in shuffled slots with slight random offset
  const area = document.getElementById('pop-play-area');
  area.innerHTML = '';
  const slots = shuffle([...SLOTS]);

  shuffle([...current.choices]).forEach((num, i) => {
    const slot = slots[i];
    const top  = slot.top  + (Math.random() * 5 - 2.5);
    const left = slot.left + (Math.random() * 5 - 2.5);
    const color = BUBBLE_COLORS[i % BUBBLE_COLORS.length];
    const dur   = (2.5 + Math.random() * 1.5).toFixed(2);
    const delay = (Math.random() * 2).toFixed(2);

    const btn = document.createElement('button');
    btn.className = 'pop-bubble';
    btn.textContent = num;
    btn.dataset.num = String(num);
    btn.setAttribute('aria-label', `Number ${num}`);
    btn.style.cssText =
      `top:${top}%; left:${left}%; background:${color};` +
      `--dur:${dur}s; --delay:-${delay}s;`;
    btn.addEventListener('click', () => handlePop(btn, num));
    area.appendChild(btn);
  });

  buildProgress();
}

function handlePop(btn, num) {
  if (btn.disabled || btn.classList.contains('wrong') || btn.classList.contains('popped')) return;

  if (num === current.target) {
    btn.classList.add('popped');
    document.querySelectorAll('.pop-bubble').forEach(b => b.disabled = true);
    score++;
    document.getElementById('score').textContent = score;
    hideTryAgainMsg(); hideHint();
    playSound('correct'); spawnConfetti();
    const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    roundNum++;
    setTimeout(() => {
      showFeedbackOverlay(p[0], p[1], `${current.target} — you found it! 🎈`, '#FF8C42', 1800, nextQuestion);
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
  showFeedbackOverlay('🎈', `${stars} ${score}/${ROUNDS}`,
    score === ROUNDS ? "You popped them all! 🏆" : 'Great popping! Play again! 🔄',
    '#FF8C42', 3500, restartGame);
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
  document.querySelectorAll('.pop-bubble.hint-glow').forEach(b => b.classList.remove('hint-glow'));
}
function activateHint() {
  playSound('hint'); sayNumber(current.target);
  document.querySelectorAll('.pop-bubble').forEach(btn => {
    if (!btn.disabled && Number(btn.dataset.num) === current.target)
      btn.classList.add('hint-glow');
  });
}

function restartGame() {
  score = 0; roundNum = 0;
  document.getElementById('score').textContent = 0;
  const targets = shuffle(Array.from({ length: 9 }, (_, i) => i + 1));
  queue = targets.slice(0, ROUNDS).map(target => {
    const pool = [];
    for (let d = -4; d <= 4; d++) {
      const n = target + d;
      if (n >= 1 && n <= 9 && n !== target) pool.push(n);
    }
    shuffle(pool);
    return { target, choices: shuffle([target, pool[0], pool[1], pool[2], pool[3]]) };
  });
  nextQuestion();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('hint-btn').addEventListener('click', () => { activateHint(); playSound('hint'); });
  document.getElementById('pop-target').addEventListener('click', () => { if (current) sayNumber(current.target); });
  restartGame();
});
