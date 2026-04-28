const ROUNDS = 8;
let queue = [], current = null, score = 0, roundNum = 0, wrongCount = 0;

// Button tint colors — one per slot, cycled
const BTN_COLORS = [
  { bg: '#FFF3E0', border: '#FF8C42', shadow: '#D4600A' },
  { bg: '#E8F5E9', border: '#28B463', shadow: '#1A7D44' },
  { bg: '#EDE7F6', border: '#9B59B6', shadow: '#703688' },
  { bg: '#E3F2FD', border: '#2E86C1', shadow: '#1A5F8E' },
];

function sayWordTwice(word) {
  if (!soundEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const speak = () => {
    const u = new SpeechSynthesisUtterance(word);
    u.rate = 0.85; u.pitch = 1.2; u.volume = 1;
    return u;
  };
  const u1 = speak();
  u1.onend = () => setTimeout(() => window.speechSynthesis.speak(speak()), 700);
  window.speechSynthesis.speak(u1);
}

function animateSoundBtn() {
  const btn = document.getElementById('first-sound-btn');
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

  // Show emoji with pop animation
  const emojiEl = document.getElementById('first-emoji');
  emojiEl.textContent = current.emoji;
  emojiEl.classList.remove('pop'); void emojiEl.offsetWidth; emojiEl.classList.add('pop');


  // Say the word twice
  animateSoundBtn();
  sayWordTwice(current.word);

  // Build 4 letter choice buttons (correct + 3 distractors)
  const pool = ITEMS.filter(i => i.letter !== current.letter);
  shuffle(pool);
  const choices = shuffle([current.letter, pool[0].letter, pool[1].letter, pool[2].letter]);

  const container = document.getElementById('first-answers');
  container.innerHTML = '';
  choices.forEach((letter, i) => {
    const c = BTN_COLORS[i];
    const btn = document.createElement('button');
    btn.className = 'first-letter-btn';
    btn.textContent = letter;
    btn.dataset.letter = letter;
    btn.setAttribute('aria-label', `Letter ${letter}`);
    btn.style.cssText = `background:${c.bg}; border-color:${c.border}; box-shadow:0 6px 0 ${c.shadow};`;
    btn.addEventListener('click', () => handleAnswer(btn, letter));
    container.appendChild(btn);
  });

  buildProgress();
}

function handleAnswer(btn, letter) {
  if (btn.disabled || btn.classList.contains('wrong') || btn.classList.contains('correct')) return;

  if (letter === current.letter) {
    btn.classList.add('correct');
    document.querySelectorAll('.first-letter-btn').forEach(b => b.disabled = true);
    score++;
    document.getElementById('score').textContent = score;
    hideTryAgainMsg(); hideHint();
    spawnConfetti(); playSound('correct');
    sayLetter(current.letter);
    const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    roundNum++;
    setTimeout(() => {
      showFeedbackOverlay(
        p[0], p[1],
        `${current.emoji} ${current.word} starts with ${current.letter}!`,
        '#F39C12', 1800, nextQuestion
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
  showFeedbackOverlay('🎓', `${stars} ${score}/${ROUNDS}`,
    score === ROUNDS ? 'You know every first letter! 🏆' : 'Great letters! Play again! 🔄',
    '#F39C12', 3500, restartGame);
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
  document.querySelectorAll('.first-letter-btn.hint-glow').forEach(b => b.classList.remove('hint-glow'));
}
function activateHint() {
  playSound('hint');
  animateSoundBtn(); sayWordTwice(current.word);
  document.querySelectorAll('.first-letter-btn').forEach(btn => {
    if (!btn.disabled && btn.dataset.letter === current.letter)
      btn.classList.add('hint-glow');
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
  document.getElementById('first-sound-btn').addEventListener('click', () => {
    if (!current) return;
    animateSoundBtn(); sayWordTwice(current.word);
  });
  restartGame();
});
