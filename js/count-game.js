const COUNT_EMOJIS = ['🍎','⭐','🌸','🦋','🐱','🍭','🎈','🐸','🌙','🍦'];
const TOTAL_ROUNDS = 8;

// [left%, top%] positions within the arrangement container for each count
// Multiple layouts per count — picked randomly each round for variety
const LAYOUTS = {
  1: [
    [[50, 50]]
  ],
  2: [
    [[28, 50], [72, 50]],
    [[35, 28], [65, 72]],
    [[50, 28], [50, 72]],
  ],
  3: [
    [[50, 22], [25, 72], [75, 72]],   // triangle apex-up
    [[25, 28], [75, 28], [50, 75]],   // triangle apex-down
    [[20, 50], [50, 50], [80, 50]],   // row
  ],
  4: [
    [[28, 28], [72, 28], [28, 72], [72, 72]],   // square
    [[50, 18], [18, 50], [82, 50], [50, 82]],   // diamond
    [[50, 30], [20, 55], [80, 55], [50, 82]],   // kite
  ],
  5: [
    [[28, 22], [72, 22], [50, 50], [28, 78], [72, 78]],   // dice 5
    [[20, 20], [80, 20], [50, 50], [20, 80], [80, 80]],   // quincunx
    [[50, 15], [82, 38], [68, 78], [32, 78], [18, 38]],   // pentagon
  ]
};

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
  const pool = shuffle([1, 2, 3, 4, 5].filter(n => n !== correct));
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

  renderArranged(area, emoji, current);

  const answersEl = document.getElementById('answers');
  answersEl.innerHTML = '';
  answersEl.classList.remove('answers-locked');

  buildChoices(current).forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'num-btn';
    btn.textContent = n;
    btn.addEventListener('click', () => handlePick(btn, n));
    answersEl.appendChild(btn);
  });
}

function renderArranged(area, emoji, count) {
  const options = LAYOUTS[count];
  const positions = options[Math.floor(Math.random() * options.length)];
  positions.forEach((pos, i) => {
    const span = document.createElement('span');
    span.className = 'count-obj';
    span.textContent = emoji;
    span.style.left = pos[0] + '%';
    span.style.top = pos[1] + '%';
    span.style.animationDelay = (i * 0.08) + 's';
    area.appendChild(span);
  });
}

function handlePick(btn, n) {
  if (busy || btn.disabled || btn.classList.contains('wrong') || btn.classList.contains('correct')) return;

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
  const nums = [1, 2, 3, 4, 5];
  queue = shuffle([...nums, ...nums]).slice(0, TOTAL_ROUNDS);
  nextRound();
});
