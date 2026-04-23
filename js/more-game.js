const ROUNDS = 8;
let queue = [], current = null, score = 0, roundNum = 0, wrongCount = 0;

const EMOJIS = ['⭐','🍎','🎈','🐝','🌸','🎯','🦋','🍭'];

// Generate all 8 rounds upfront
function generateQueue() {
  const rounds = [];

  // Rounds 1–3: always MORE, big gap (4–5)
  for (let i = 0; i < 3; i++) {
    rounds.push(makeRound('more', 4 + Math.floor(Math.random() * 2)));
  }
  // Rounds 4–6: always MORE, medium gap (2–3)
  for (let i = 0; i < 3; i++) {
    rounds.push(makeRound('more', 2 + Math.floor(Math.random() * 2)));
  }
  // Rounds 7–8: mix MORE / FEWER, gap 2–3
  for (let i = 0; i < 2; i++) {
    const ask = Math.random() > 0.5 ? 'more' : 'fewer';
    rounds.push(makeRound(ask, 2 + Math.floor(Math.random() * 2)));
  }

  return rounds;
}

function makeRound(ask, gap) {
  // Pick the smaller number so both counts stay within 1–9
  const smaller = Math.floor(Math.random() * (9 - gap)) + 1;
  const larger  = smaller + gap;

  // Randomly place larger/smaller on left or right
  const leftCount  = Math.random() > 0.5 ? larger : smaller;
  const rightCount = leftCount === larger ? smaller : larger;

  const correctSide = ask === 'more'
    ? (leftCount > rightCount ? 'left' : 'right')
    : (leftCount < rightCount ? 'left' : 'right');

  return { ask, leftCount, rightCount, correctSide };
}

function sayQuestion(ask) {
  if (!soundEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const text = ask === 'more' ? 'Which side has more?' : 'Which side has fewer?';
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9; u.pitch = 1.2; u.volume = 1;
  window.speechSynthesis.speak(u);
}

function animateSoundBtn() {
  const btn = document.getElementById('more-sound-btn');
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

function renderObjects(containerId, count, emoji, delayOffset) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const span = document.createElement('span');
    span.className = 'side-obj';
    span.textContent = emoji;
    span.style.animationDelay = (delayOffset + i * 0.04) + 's';
    el.appendChild(span);
  }
}

function nextQuestion() {
  if (roundNum >= ROUNDS) { showEnd(); return; }
  wrongCount = 0;
  hideTryAgainMsg(); hideHint();

  current = queue[roundNum];
  document.getElementById('round').textContent = roundNum + 1;

  // Update question text
  const qText = current.ask === 'more' ? 'Which side has MORE?' : 'Which side has FEWER?';
  document.getElementById('more-question').textContent = qText;

  // Reset side buttons
  ['side-left', 'side-right'].forEach(id => {
    const btn = document.getElementById(id);
    btn.className = 'side-btn';
    btn.disabled = false;
  });

  // Render objects on each side
  const emoji = EMOJIS[roundNum % EMOJIS.length];
  renderObjects('objects-left',  current.leftCount,  emoji, 0);
  renderObjects('objects-right', current.rightCount, emoji, 0.1);

  // Say the question aloud
  animateSoundBtn();
  sayQuestion(current.ask);

  buildProgress();
}

function handlePick(side) {
  const btn = document.getElementById('side-' + side);
  if (btn.disabled || btn.classList.contains('wrong') || btn.classList.contains('correct')) return;

  if (side === current.correctSide) {
    btn.classList.add('correct');
    document.getElementById('side-left').disabled  = true;
    document.getElementById('side-right').disabled = true;
    score++;
    document.getElementById('score').textContent = score;
    hideTryAgainMsg(); hideHint();
    playSound('correct'); spawnConfetti();

    const bigger  = Math.max(current.leftCount, current.rightCount);
    const smaller = Math.min(current.leftCount, current.rightCount);
    const sub = current.ask === 'more'
      ? `${bigger} is more than ${smaller}! 🎉`
      : `${smaller} is fewer than ${bigger}! 🎉`;
    const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    roundNum++;
    setTimeout(() => {
      showFeedbackOverlay(p[0], p[1], sub, '#8E44AD', 1800, nextQuestion);
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
  showFeedbackOverlay('⚖️', `${stars} ${score}/${ROUNDS}`,
    score === ROUNDS ? "Perfect! You know more and less! 🏆" : 'Great job! Play again! 🔄',
    '#8E44AD', 3500, restartGame);
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
  ['side-left', 'side-right'].forEach(id =>
    document.getElementById(id).classList.remove('hint-glow'));
}
function activateHint() {
  playSound('hint');
  animateSoundBtn(); sayQuestion(current.ask);
  document.getElementById('side-' + current.correctSide).classList.add('hint-glow');
}

function restartGame() {
  score = 0; roundNum = 0;
  document.getElementById('score').textContent = 0;
  queue = generateQueue();
  nextQuestion();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('hint-btn').addEventListener('click', () => { activateHint(); playSound('hint'); });
  document.getElementById('more-sound-btn').addEventListener('click', () => {
    if (!current) return;
    animateSoundBtn(); sayQuestion(current.ask);
  });
  document.getElementById('side-left').addEventListener('click',  () => handlePick('left'));
  document.getElementById('side-right').addEventListener('click', () => handlePick('right'));
  restartGame();
});
