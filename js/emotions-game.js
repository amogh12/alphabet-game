const ROUNDS = 8;
let queue = [], current = null, score = 0, roundNum = 0, wrongCount = 0;

const EMOTIONS = [
  { id: 'happy',     label: 'Happy',     emoji: '😊' },
  { id: 'sad',       label: 'Sad',       emoji: '😢' },
  { id: 'angry',     label: 'Angry',     emoji: '😠' },
  { id: 'surprised', label: 'Surprised', emoji: '😲' },
  { id: 'scared',    label: 'Scared',    emoji: '😨' },
  { id: 'excited',   label: 'Excited',   emoji: '🤩' },
  { id: 'silly',     label: 'Silly',     emoji: '😜' },
  { id: 'tired',     label: 'Tired',     emoji: '😴' },
  { id: 'confused',  label: 'Confused',  emoji: '😕' },
  { id: 'shy',       label: 'Shy',       emoji: '😳' },
  { id: 'disgusted', label: 'Disgusted', emoji: '🤢' },
  { id: 'bored',     label: 'Bored',     emoji: '😑' },
];

function sayEmotionTwice(label) {
  if (!soundEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const speak = () => {
    const u = new SpeechSynthesisUtterance(label);
    u.rate = 0.85; u.pitch = 1.3; u.volume = 1;
    return u;
  };
  const u1 = speak();
  u1.onend = () => setTimeout(() => window.speechSynthesis.speak(speak()), 600);
  window.speechSynthesis.speak(u1);
}

function animateSoundBtn() {
  const btn = document.getElementById('emotion-sound-btn');
  if (!btn) return;
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

function nextQuestion() {
  if (roundNum >= ROUNDS) { showEnd(); return; }
  wrongCount = 0;
  hideTryAgainMsg(); hideHint();

  current = queue[roundNum];
  document.getElementById('round').textContent = roundNum + 1;

  // Say the emotion name twice
  animateSoundBtn();
  sayEmotionTwice(current.target.label);

  // Build 2x2 grid of emotion face buttons
  const grid = document.getElementById('emotion-grid');
  grid.innerHTML = '';
  shuffle([...current.choices]).forEach(emotion => {
    const btn = document.createElement('button');
    btn.className = 'emotion-btn';
    btn.setAttribute('aria-label', emotion.label);
    btn.dataset.id = emotion.id;
    btn.innerHTML = `<span class="emotion-face">${emotion.emoji}</span>`;
    btn.addEventListener('click', () => handlePick(btn, emotion));
    grid.appendChild(btn);
  });

  buildProgress();
}

function handlePick(btn, emotion) {
  if (btn.disabled || btn.classList.contains('wrong') || btn.classList.contains('correct')) return;

  if (emotion.id === current.target.id) {
    btn.classList.add('correct');
    document.querySelectorAll('.emotion-btn').forEach(b => b.disabled = true);
    score++;
    document.getElementById('score').textContent = score;
    hideTryAgainMsg(); hideHint();
    playSound('correct'); spawnConfetti();
    const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    roundNum++;
    setTimeout(() => {
      showFeedbackOverlay(
        current.target.emoji,
        `${p[0]} ${p[1]}`,
        `${current.target.label}! You know your feelings! 🎉`,
        '#FF6B9D', 1800, nextQuestion
      );
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
  showFeedbackOverlay('😊', `${stars} ${score}/${ROUNDS}`,
    score === ROUNDS ? 'You know all the feelings! 🏆' : 'Great job! Play again! 🔄',
    '#FF6B9D', 3500, restartGame);
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
  document.querySelectorAll('.emotion-btn.hint-glow').forEach(b => b.classList.remove('hint-glow'));
}
function activateHint() {
  playSound('hint');
  animateSoundBtn(); sayEmotionTwice(current.target.label);
  document.querySelectorAll('.emotion-btn').forEach(btn => {
    if (!btn.disabled && btn.dataset.id === current.target.id)
      btn.classList.add('hint-glow');
  });
}

function restartGame() {
  score = 0; roundNum = 0;
  document.getElementById('score').textContent = 0;
  const pool = shuffle([...EMOTIONS]);
  queue = pool.slice(0, ROUNDS).map(target => {
    const distractors = shuffle(EMOTIONS.filter(e => e.id !== target.id)).slice(0, 3);
    return { target, choices: shuffle([target, ...distractors]) };
  });
  nextQuestion();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('hint-btn').addEventListener('click', () => { activateHint(); playSound('hint'); });
  document.getElementById('emotion-sound-btn').addEventListener('click', () => {
    if (!current) return;
    animateSoundBtn(); sayEmotionTwice(current.target.label);
  });
  restartGame();
});
