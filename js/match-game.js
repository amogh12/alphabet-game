const TOTAL_PAIRS = 5;

let cards = [], firstPick = null, secondPick = null, locked = false, matchedCount = 0, moves = 0;

function makeDotsFace(n) {
  const div = document.createElement('div');
  div.className = 'dots-face';
  for (let i = 0; i < n; i++) {
    const pip = document.createElement('div');
    pip.className = 'dot-pip';
    div.appendChild(pip);
  }
  return div;
}

function buildGrid() {
  const pairs = [];
  for (let n = 1; n <= TOTAL_PAIRS; n++) {
    pairs.push({value: n, type: 'digit'});
    pairs.push({value: n, type: 'dots'});
  }
  cards = shuffle(pairs).map((c, i) => ({...c, id: i, matched: false}));

  const grid = document.getElementById('match-grid');
  grid.innerHTML = '';

  cards.forEach((card, idx) => {
    const el = document.createElement('div');
    el.className = 'match-card';
    el.dataset.idx = idx;

    const inner = document.createElement('div');
    inner.className = 'match-card-inner';

    const back = document.createElement('div');
    back.className = 'match-card-back';
    back.textContent = '?';

    const front = document.createElement('div');
    front.className = 'match-card-front';
    if (card.type === 'digit') {
      const d = document.createElement('div');
      d.className = 'card-digit';
      d.textContent = card.value;
      front.appendChild(d);
    } else {
      front.appendChild(makeDotsFace(card.value));
    }

    inner.appendChild(back);
    inner.appendChild(front);
    el.appendChild(inner);
    el.addEventListener('click', () => handleFlip(el, idx));
    grid.appendChild(el);
  });
}

function handleFlip(el, idx) {
  if (locked) return;
  if (el.classList.contains('flipped') || el.classList.contains('matched')) return;

  el.classList.add('flipped');
  playSound('hint');

  if (!firstPick) {
    firstPick = {el, idx};
    return;
  }

  secondPick = {el, idx};
  locked = true;
  moves++;
  document.getElementById('moves').textContent = moves;

  const a = cards[firstPick.idx];
  const b = cards[secondPick.idx];

  if (a.value === b.value) {
    setTimeout(() => {
      firstPick.el.classList.add('matched');
      secondPick.el.classList.add('matched');
      playSound('correct');
      matchedCount++;
      document.getElementById('matched').textContent = matchedCount;
      document.getElementById('match-status').textContent =
        matchedCount === TOTAL_PAIRS ? 'All matched! 🎉' : `${matchedCount} pair${matchedCount > 1 ? 's' : ''} found! Keep going!`;
      reset();
      if (matchedCount === TOTAL_PAIRS) endGame();
    }, 400);
  } else {
    setTimeout(() => {
      firstPick.el.classList.remove('flipped');
      secondPick.el.classList.remove('flipped');
      playSound('wrong');
      reset();
    }, 900);
  }
}

function reset() {
  firstPick = null;
  secondPick = null;
  locked = false;
}

function endGame() {
  const msg = moves <= 10 ? 'Amazing memory! 🧠' : moves <= 15 ? 'Great job! 🌟' : 'You did it! 🎉';
  setTimeout(() => {
    playSound('fanfare');
    spawnConfetti();
    showFeedbackOverlay('🏆', 'All matched!', `${msg} ${moves} moves`, '#9B59B6', 3000, () => {
      window.location.href = 'index.html';
    });
  }, 600);
}

document.addEventListener('DOMContentLoaded', () => {
  buildGrid();
});
