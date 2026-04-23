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

// Called synchronously inside the click handler so the browser keeps the
// user-gesture context for speechSynthesis. Highlights tiles with fixed
// timing; onDone fires after the last number's slot.
function saySequence(nums, onDone) {
  const STEP  = 850;  // ms between each spoken number
  const DELAY = 500;  // wait for the correct chime to finish first

  // Queue all utterances immediately — must stay inside the user-gesture call stack
  if (soundEnabled && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    nums.forEach(num => {
      const u = new SpeechSynthesisUtterance(String(num));
      u.rate = 0.85; u.pitch = 1.3; u.volume = 1;
      window.speechSynthesis.speak(u);
    });
  }

  // Stagger tile highlights (start after the chime, then one per STEP)
  const tiles = Array.from(document.querySelectorAll('#sequence-display .seq-num'));
  nums.forEach((_, idx) => {
    setTimeout(() => {
      tiles.forEach(t => t.classList.remove('seq-highlight'));
      if (tiles[idx]) tiles[idx].classList.add('seq-highlight');
    }, DELAY + idx * STEP);
  });

  // Clear highlights then call onDone
  setTimeout(() => {
    tiles.forEach(t => t.classList.remove('seq-highlight'));
    onDone();
  }, DELAY + nums.length * STEP + 200);
}

function handlePick(btn, n) {
  if (btn.disabled || btn.classList.contains('wrong') || btn.classList.contains('correct')) return;

  const blank = document.querySelector('.seq-blank');

  if (n === current.answer) {
    if (blank) { blank.classList.remove('seq-blank'); blank.classList.add('seq-num'); blank.textContent = n; }
    btn.classList.add('correct');
    document.querySelectorAll('.num-btn').forEach(b => b.disabled = true);
    score++;
    document.getElementById('score').textContent = score;
    playSound('correct');
    spawnConfetti();
    const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    // saySequence is called here — NOT inside setTimeout — so speech synthesis
    // keeps the user-gesture context the browser requires.
    saySequence(current.nums, () => {
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
