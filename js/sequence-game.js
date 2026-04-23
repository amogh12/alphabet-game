const SEQ_ROUNDS = 8;

let queue = [], current = null, score = 0, roundNum = 0;

function buildProgress() {
  const el = document.getElementById('progress');
  el.innerHTML = '';
  for (let i = 0; i < SEQ_ROUNDS; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i < roundNum - 1 ? ' done' : i === roundNum - 1 ? ' current' : '');
    el.appendChild(d);
  }
}

function buildChoices(answer) {
  const pool = [];
  for (let d = -4; d <= 4; d++) {
    const n = answer + d;
    if (n >= 1 && n <= 10 && n !== answer) pool.push(n);
  }
  shuffle(pool);
  return shuffle([answer, pool[0], pool[1]]);
}

function nextRound() {
  if (queue.length === 0) { endGame(); return; }
  current = queue.shift();
  roundNum++;
  buildProgress();
  document.getElementById('round').textContent = roundNum;

  const display = document.getElementById('sequence-display');
  display.innerHTML = '';
  current.nums.forEach((n, i) => {
    if (i > 0) {
      const comma = document.createElement('span');
      comma.className = 'seq-comma';
      comma.textContent = ',';
      display.appendChild(comma);
    }
    const tile = document.createElement('div');
    if (i === current.gapIdx) {
      tile.className = 'seq-blank';
      tile.textContent = '?';
    } else {
      tile.className = 'seq-num';
      tile.textContent = n;
    }
    display.appendChild(tile);
  });

  const answersEl = document.getElementById('answers');
  answersEl.innerHTML = '';
  answersEl.style.gridTemplateColumns = '1fr 1fr 1fr';
  buildChoices(current.answer).forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'num-btn';
    btn.textContent = n;
    btn.addEventListener('click', () => handlePick(btn, n));
    answersEl.appendChild(btn);
  });
}

// Called directly inside the click handler (no setTimeout wrapper) so
// speechSynthesis.speak() keeps the browser's user-gesture context.
// Highlights each tile in turn, then fires onDone when the last one clears.
function saySequence(nums, onDone) {
  const STEP = 400;

  if (soundEnabled && window.speechSynthesis) {
    // Single utterance = no inter-number gaps from the browser's speech queue
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(nums.join(', '));
    u.rate = 1.3; u.pitch = 1.3; u.volume = 1;
    window.speechSynthesis.speak(u);
  }

  const tiles = Array.from(document.querySelectorAll('#sequence-display .seq-num'));
  nums.forEach((_, idx) => {
    setTimeout(() => {
      tiles.forEach(t => t.classList.remove('seq-highlight'));
      if (tiles[idx]) tiles[idx].classList.add('seq-highlight');
    }, idx * STEP);
  });

  setTimeout(() => {
    tiles.forEach(t => t.classList.remove('seq-highlight'));
    onDone();
  }, nums.length * STEP + 200);
}

function handlePick(btn, n) {
  if (btn.disabled || btn.classList.contains('wrong') || btn.classList.contains('correct')) return;

  const blank = document.querySelector('.seq-blank');

  if (n === current.answer) {
    // 1. Fill the blank and mark button correct immediately
    if (blank) { blank.classList.remove('seq-blank'); blank.classList.add('seq-num'); blank.textContent = n; }
    btn.classList.add('correct');
    document.querySelectorAll('.num-btn').forEach(b => b.disabled = true);
    score++;
    document.getElementById('score').textContent = score;

    // 2. Read the sequence aloud right now (must stay in click-handler call stack)
    const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    saySequence(current.nums, () => {
      // 3. Sequence done → celebrate, then show overlay → next round
      playSound('correct');
      spawnConfetti();
      showFeedbackOverlay(p[0], p[1], `${current.answer} fits perfectly! ` + p[2], '#2E86C1', 1600, nextRound);
    });
  } else {
    btn.classList.add('wrong');
    btn.disabled = true;
    playSound('wrong');
  }
}

function endGame() {
  playSound('fanfare');
  spawnConfetti();
  showFeedbackOverlay('🏆', 'Number star!', `Score: ${score}/${SEQ_ROUNDS} 🎉`, '#2E86C1', 3000, () => {
    window.location.href = 'index.html';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const starts = shuffle(Array.from({length: 7}, (_, i) => i + 1));
  queue = starts.slice(0, SEQ_ROUNDS).map(start => {
    const nums = [start, start + 1, start + 2, start + 3];
    const gapIdx = Math.floor(Math.random() * 4);
    return {nums, gapIdx, answer: nums[gapIdx]};
  });
  nextRound();
});
