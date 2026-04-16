const ROUNDS = 8;
let queue = [], current = null, score = 0, roundNum = 0, wrongCount = 0;

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
  const bl = document.getElementById('big-letter');
  bl.style.color = COLORS[roundNum % COLORS.length];
  bl.textContent = current.letter;
  document.getElementById('letter-name').textContent = current.letter;
  document.getElementById('round').textContent = roundNum + 1;
  bl.classList.remove('pop'); void bl.offsetWidth; bl.classList.add('pop');
  setTimeout(() => sayLetter(current.letter), 300);

  const pool = ITEMS.filter(i => i.letter !== current.letter);
  shuffle(pool);
  const options = shuffle([current, pool[0], pool[1], pool[2]]);
  const container = document.getElementById('answers');
  container.innerHTML = '';
  options.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.setAttribute('aria-label', item.word);
    btn.innerHTML = `<span class="emoji">${item.emoji}</span><span class="word"><span class="first-letter">${item.word[0]}</span>${item.word.slice(1)}</span>`;
    btn.addEventListener('click', () => handleAnswer(btn, item));
    container.appendChild(btn);
  });
  buildProgress();
}

function handleAnswer(btn, item) {
  if (btn.disabled || btn.classList.contains('wrong') || btn.classList.contains('correct')) return;
  if (item.letter === current.letter) {
    btn.classList.add('correct');
    document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);
    score++;
    document.getElementById('score').textContent = score;
    hideTryAgainMsg(); hideHint();
    spawnConfetti(); playSound('correct'); sayWord(item.word);
    const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    roundNum++;
    setTimeout(() => {
      showFeedbackOverlay(p[0], p[1], `${current.emoji} ${current.word} starts with ${current.letter}!`, '#FF6B6B', 1800, nextQuestion);
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
  showFeedbackOverlay('🎓', `${stars} ${score}/${ROUNDS}`,
    score === ROUNDS ? 'Perfect score! You\'re a genius! 🏆' : 'Great job! Play again! 🔄',
    '#FF6B6B', 3500, restartGame);
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
    if (!btn.disabled) {
      const w = btn.querySelector('.word');
      if (w && w.textContent.trim().toUpperCase().startsWith(current.letter))
        btn.classList.add('hint-glow');
    }
  });
}

function restartGame() {
  score = 0; roundNum = 0;
  document.getElementById('score').textContent = 0;
  queue = shuffle([...ITEMS]).slice(0, ROUNDS);
  nextQuestion();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('hint-btn').addEventListener('click', () => { activateHint(); playSound('hint'); });
  document.getElementById('big-letter').addEventListener('click', () => {
    if (!current) return;
    sayLetter(current.letter);
    const bl = document.getElementById('big-letter');
    bl.classList.remove('pop'); void bl.offsetWidth; bl.classList.add('pop');
  });
  document.getElementById('big-letter').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') sayLetter(current.letter);
  });

  restartGame();
});
