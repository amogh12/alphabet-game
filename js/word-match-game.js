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
  document.getElementById('round').textContent = roundNum + 1;
  document.getElementById('word-display').textContent = current.word;

  const sb = document.getElementById('word-sound-btn');
  sb.classList.remove('sound-pop'); void sb.offsetWidth; sb.classList.add('sound-pop');
  setTimeout(() => sayWord(current.word.toLowerCase()), 300);

  const pool = TRACE_WORDS.filter(w => w.word !== current.word);
  shuffle(pool);
  const options = shuffle([current, pool[0], pool[1], pool[2]]);

  const container = document.getElementById('word-answers');
  container.innerHTML = '';
  options.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn word-match-btn';
    btn.setAttribute('data-word', item.word);
    btn.innerHTML = `<span class="emoji" style="font-size:clamp(2.8rem,12vw,4rem)">${item.emoji}</span>`;
    btn.addEventListener('click', () => handlePick(btn, item));
    container.appendChild(btn);
  });
  buildProgress();
}

function handlePick(btn, item) {
  if (btn.disabled || btn.classList.contains('wrong') || btn.classList.contains('correct')) return;
  if (item.word === current.word) {
    btn.classList.add('correct');
    document.querySelectorAll('.word-match-btn').forEach(b => b.disabled = true);
    score++;
    document.getElementById('score').textContent = score;
    spawnConfetti(); playSound('correct');
    hideTryAgainMsg(); hideHint();
    const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    roundNum++;
    setTimeout(() => {
      showFeedbackOverlay(p[0], p[1], `${current.emoji} ${current.word.toLowerCase()}!`, '#00897B', 1800, nextQuestion);
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
  const stars = score >= ROUNDS ? '🌟🌟🌟' : score >= 6 ? '⭐⭐⭐' : score >= 4 ? '⭐⭐' : '⭐';
  showFeedbackOverlay('🎓', `${stars} ${score}/${ROUNDS}`,
    score === ROUNDS ? 'You can read every word! 🏆' : 'Great reading! Play again! 🔄',
    '#00897B', 3500, restartGame);
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
  document.querySelectorAll('.word-match-btn.hint-glow').forEach(b => b.classList.remove('hint-glow'));
}
function activateHint() {
  playSound('hint'); sayWord(current.word.toLowerCase());
  document.querySelectorAll('.word-match-btn').forEach(btn => {
    if (!btn.disabled && btn.dataset.word === current.word) btn.classList.add('hint-glow');
  });
}

function restartGame() {
  score = 0; roundNum = 0;
  document.getElementById('score').textContent = 0;
  queue = shuffle([...TRACE_WORDS]).slice(0, ROUNDS);
  nextQuestion();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('hint-btn').addEventListener('click', () => { activateHint(); playSound('hint'); });
  document.getElementById('word-sound-btn').addEventListener('click', () => {
    if (!current) return;
    sayWord(current.word.toLowerCase());
    const sb = document.getElementById('word-sound-btn');
    sb.classList.remove('sound-pop'); void sb.offsetWidth; sb.classList.add('sound-pop');
  });
  restartGame();
});
