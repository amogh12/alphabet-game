const ROUNDS = 8;
let queue = [], current = null, score = 0, roundNum = 0, wrongCount = 0;

const PAT_COLORS = [
  { id: 'red',    hex: '#FF6B6B', label: 'Red'    },
  { id: 'blue',   hex: '#2E86C1', label: 'Blue'   },
  { id: 'yellow', hex: '#F4D03F', label: 'Yellow' },
  { id: 'green',  hex: '#28B463', label: 'Green'  },
];

// Pattern types: each produces a 5-item sequence with blank at end
const PAT_TYPES = [
  // AB: A B A B ? → answer = A
  (a, b) => ({ seq: [a,b,a,b,a], answer: a }),
  // AB variant: A B A B ? where answer is B (show A B A B B? no...)
  // Actually let's do: A B A B B? No. Let's vary by shifting:
  // Show B A B A ? → answer = B
  (a, b) => ({ seq: [b,a,b,a,b], answer: b }),
  // AAB: A A B A ? → answer = A
  (a, b) => ({ seq: [a,a,b,a,a], answer: a, blank: 4 }),
  // AAB variant: A A B A A ? → answer = B (6 items)
  (a, b) => ({ seq: [a,a,b,a,a,b], answer: b }),
  // ABB: A B B A ? → answer = B
  (a, b) => ({ seq: [a,b,b,a,b], answer: b }),
  // ABB variant: A B B A B ? → answer = B (6 items)
  (a, b) => ({ seq: [a,b,b,a,b,b], answer: b }),
];

function generateQueue() {
  const rounds = [];
  // Rounds 1-3: AB only
  for (let i = 0; i < 3; i++) {
    const [a, b] = shuffle([...PAT_COLORS]).slice(0, 2);
    const fn = PAT_TYPES[i % 2];
    rounds.push({ ...fn(a, b), typeLabel: 'AB' });
  }
  // Rounds 4-6: AAB
  for (let i = 0; i < 3; i++) {
    const [a, b] = shuffle([...PAT_COLORS]).slice(0, 2);
    const fn = PAT_TYPES[2 + (i % 2)];
    rounds.push({ ...fn(a, b), typeLabel: 'AAB' });
  }
  // Rounds 7-8: ABB
  for (let i = 0; i < 2; i++) {
    const [a, b] = shuffle([...PAT_COLORS]).slice(0, 2);
    const fn = PAT_TYPES[4 + (i % 2)];
    rounds.push({ ...fn(a, b), typeLabel: 'ABB' });
  }
  return rounds;
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

function makePatItem(colorObj, delay) {
  const div = document.createElement('div');
  div.className = 'pat-item';
  div.style.background = colorObj.hex;
  div.style.animationDelay = delay + 's';
  return div;
}

function makeBlank() {
  const div = document.createElement('div');
  div.className = 'pat-item pat-blank';
  div.textContent = '?';
  return div;
}

function nextQuestion() {
  if (roundNum >= ROUNDS) { showEnd(); return; }
  wrongCount = 0;
  hideTryAgainMsg(); hideHint();

  current = queue[roundNum];
  document.getElementById('round').textContent = roundNum + 1;

  // Render pattern row — last item is always the blank
  const display = document.getElementById('pattern-display');
  display.innerHTML = '';
  const visible = current.seq.slice(0, -1);
  visible.forEach((colorObj, i) => {
    display.appendChild(makePatItem(colorObj, i * 0.06));
  });
  display.appendChild(makeBlank());

  // Build answer choices: correct + up to 2 wrong (other colors not used as answer)
  const wrongPool = PAT_COLORS.filter(c => c.id !== current.answer.id);
  shuffle(wrongPool);
  const choices = shuffle([current.answer, wrongPool[0], wrongPool[1]]);

  const container = document.getElementById('answers');
  container.innerHTML = '';
  container.style.gridTemplateColumns = '1fr 1fr 1fr';
  choices.forEach(colorObj => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn pattern-answer-btn';
    btn.setAttribute('aria-label', colorObj.label);
    btn.dataset.colorId = colorObj.id;
    const shape = document.createElement('div');
    shape.className = 'pat-answer-shape';
    shape.style.background = colorObj.hex;
    btn.appendChild(shape);
    const lbl = document.createElement('span');
    lbl.className = 'pat-btn-label';
    lbl.textContent = colorObj.label;
    btn.appendChild(lbl);
    btn.addEventListener('click', () => handleAnswer(btn, colorObj));
    container.appendChild(btn);
  });
  buildProgress();
}

function handleAnswer(btn, colorObj) {
  if (btn.disabled || btn.classList.contains('wrong') || btn.classList.contains('correct')) return;
  if (colorObj.id === current.answer.id) {
    btn.classList.add('correct');
    document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);

    // Fill in the blank with the correct color
    const blank = document.querySelector('.pat-blank');
    if (blank) {
      blank.classList.remove('pat-blank');
      blank.style.background = colorObj.hex;
      blank.textContent = '';
    }

    score++;
    document.getElementById('score').textContent = score;
    hideTryAgainMsg(); hideHint();
    spawnConfetti(); playSound('correct');
    const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    roundNum++;
    setTimeout(() => {
      showFeedbackOverlay(p[0], p[1], `${colorObj.label} is right! Great pattern work! 🎨`, '#E67E22', 1800, nextQuestion);
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
  showFeedbackOverlay('🔁', `${stars} ${score}/${ROUNDS}`,
    score === ROUNDS ? "Perfect patterns! You're a star! 🏆" : 'Great job! Play again! 🔄',
    '#E67E22', 3500, restartGame);
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
    if (!btn.disabled && btn.dataset.colorId === current.answer.id) btn.classList.add('hint-glow');
  });
}

function restartGame() {
  score = 0; roundNum = 0;
  document.getElementById('score').textContent = 0;
  queue = generateQueue();
  nextQuestion();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('hint-btn').addEventListener('click', () => { activateHint(); playSound('hint'); });
  restartGame();
});
