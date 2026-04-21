const ROUNDS = 8;
let queue = [], current = null, score = 0, roundNum = 0, wrongCount = 0;

const PHONEMES = {
  A:'aah', B:'buh', C:'kuh', D:'duh', E:'eh',  F:'fuh', G:'guh',
  H:'huh', I:'ih',  J:'juh', K:'kuh', L:'luh', M:'mmm', N:'nnn',
  O:'oh',  P:'puh', Q:'kwuh',R:'rrr', S:'sss', T:'tuh', U:'uh',
  V:'vvv', W:'wuh', X:'ksss',Y:'yuh', Z:'zzz',
};

function saySound(letter) {
  if (!soundEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(PHONEMES[letter] || letter);
  u.rate = 0.65; u.pitch = 1.2; u.volume = 1;
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

  const sb = document.getElementById('play-sound-btn');
  sb.classList.remove('sound-pop'); void sb.offsetWidth; sb.classList.add('sound-pop');
  setTimeout(() => saySound(current.letter), 300);

  const pool = ITEMS.filter(i => i.letter !== current.letter);
  shuffle(pool);
  const options = shuffle([current, pool[0], pool[1], pool[2]]);

  const container = document.getElementById('answers');
  container.innerHTML = '';
  options.forEach((item, idx) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn sound-letter-btn';
    btn.setAttribute('aria-label', `Letter ${item.letter}`);
    btn.innerHTML = `<span class="sound-big-letter" style="color:${COLORS[idx % COLORS.length]}">${item.letter}</span>`;
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
    spawnConfetti(); playSound('correct'); sayWord(current.word);
    const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    roundNum++;
    setTimeout(() => {
      showFeedbackOverlay(p[0], p[1], `${current.emoji} ${current.word} starts with ${current.letter}!`, '#E91E8C', 1800, nextQuestion);
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
    score === ROUNDS ? "Perfect! You know every sound! 🏆" : 'Great job! Play again! 🔄',
    '#E91E8C', 3500, restartGame);
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
      const l = btn.querySelector('.sound-big-letter');
      if (l && l.textContent.trim() === current.letter) btn.classList.add('hint-glow');
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
  document.getElementById('play-sound-btn').addEventListener('click', () => {
    if (!current) return;
    saySound(current.letter);
    const sb = document.getElementById('play-sound-btn');
    sb.classList.remove('sound-pop'); void sb.offsetWidth; sb.classList.add('sound-pop');
  });
  restartGame();
});
