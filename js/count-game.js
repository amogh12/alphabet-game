const COUNT_EMOJIS = ['🍎','⭐','🌸','🦋','🐱','🍭','🎈','🐸','🌙','🍦'];
const TOTAL_ROUNDS = 8;

let queue = [], current = null, score = 0, roundNum = 0, busy = false;

function buildProgress() {
  const el = document.getElementById('progress');
  el.innerHTML = '';
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i < roundNum - 1 ? ' done' : i === roundNum - 1 ? ' current' : '');
    el.appendChild(d);
  }
}

function buildChoices(correct) {
  const pool = shuffle(Array.from({length: 10}, (_, i) => i + 1).filter(n => n !== correct));
  return shuffle([correct, pool[0], pool[1], pool[2]]);
}

function nextRound() {
  if (queue.length === 0) { endGame(); return; }
  current = queue.shift();
  roundNum++;
  busy = false;
  buildProgress();
  document.getElementById('round').textContent = roundNum;

  const emoji = COUNT_EMOJIS[Math.floor(Math.random() * COUNT_EMOJIS.length)];
  const area = document.getElementById('count-objects');
  area.innerHTML = '';
  for (let i = 0; i < current; i++) {
    const span = document.createElement('span');
    span.className = 'count-obj';
    span.textContent = emoji;
    span.style.animationDelay = (i * 0.07) + 's';
    area.appendChild(span);
  }

  const answersEl = document.getElementById('answers');
  answersEl.innerHTML = '';
  buildChoices(current).forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'num-btn';
    btn.textContent = n;
    btn.addEventListener('click', () => handlePick(btn, n));
    answersEl.appendChild(btn);
  });
}

function handlePick(btn, n) {
  if (btn.disabled || btn.classList.contains('wrong') || btn.classList.contains('correct')) return;

  if (n === current) {
    btn.classList.add('correct');
    document.querySelectorAll('.num-btn').forEach(b => b.disabled = true);
    score++;
    document.getElementById('score').textContent = score;
    playSound('correct');
    spawnConfetti();
    const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    setTimeout(() => {
      showFeedbackOverlay(p[0], p[1], `You counted ${current}! ` + p[2], '#9B59B6', 1600, nextRound);
    }, 300);
  } else {
    btn.classList.add('wrong');
    btn.disabled = true;
    playSound('wrong');
  }
}

function endGame() {
  playSound('fanfare');
  spawnConfetti();
  showFeedbackOverlay('🏆', 'Amazing counting!', `Score: ${score}/${TOTAL_ROUNDS} 🎉`, '#9B59B6', 3000, () => {
    window.location.href = 'index.html';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  queue = shuffle(Array.from({length: 10}, (_, i) => i + 1)).slice(0, TOTAL_ROUNDS);
  nextRound();
});
