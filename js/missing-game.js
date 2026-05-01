const ROUNDS = 8;
let queue = [], current = null, score = 0, roundNum = 0, wrongCount = 0;

const BTN_COLORS = [
  { bg: '#FFF3E0', border: '#FF8C42', shadow: '#D4600A' },
  { bg: '#E8F5E9', border: '#28B463', shadow: '#1A7D44' },
  { bg: '#EDE7F6', border: '#9B59B6', shadow: '#703688' },
];

function sayWordTwice(word) {
  if (!soundEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const speak = () => {
    const u = new SpeechSynthesisUtterance(word.toLowerCase());
    u.rate = 0.85; u.pitch = 1.2; u.volume = 1;
    return u;
  };
  const u1 = speak();
  u1.onend = () => setTimeout(() => window.speechSynthesis.speak(speak()), 700);
  window.speechSynthesis.speak(u1);
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

function getDistractors(correct) {
  const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l => l !== correct);
  shuffle(pool);
  return [pool[0], pool[1]];
}

function renderWordDisplay() {
  const container = document.getElementById('missing-word-display');
  container.innerHTML = '';
  current.word.split('').forEach((letter, i) => {
    const box = document.createElement('div');
    if (i === current.blankPos) {
      box.className = 'missing-box missing-box-blank';
      box.textContent = '?';
      box.id = 'blank-box';
    } else {
      box.className = 'missing-box';
      box.textContent = letter;
    }
    container.appendChild(box);
  });
}

function nextQuestion() {
  if (roundNum >= ROUNDS) { showEnd(); return; }
  wrongCount = 0;
  hideTryAgainMsg(); hideHint();

  current = queue[roundNum];
  document.getElementById('round').textContent = roundNum + 1;

  const emojiEl = document.getElementById('missing-emoji');
  emojiEl.textContent = current.emoji;
  emojiEl.classList.remove('pop'); void emojiEl.offsetWidth; emojiEl.classList.add('pop');

  renderWordDisplay();
  buildChoices();
  buildProgress();

  const soundBtn = document.getElementById('missing-sound-btn');
  soundBtn.classList.remove('sound-pop'); void soundBtn.offsetWidth; soundBtn.classList.add('sound-pop');
  sayWordTwice(current.word);
}

function buildChoices() {
  const container = document.getElementById('missing-choices');
  container.innerHTML = '';
  const correct = current.word[current.blankPos];
  const choices = shuffle([correct, ...getDistractors(correct)]);

  choices.forEach((letter, i) => {
    const c = BTN_COLORS[i];
    const btn = document.createElement('button');
    btn.className = 'missing-btn';
    btn.textContent = letter;
    btn.dataset.letter = letter;
    btn.setAttribute('aria-label', `Letter ${letter}`);
    btn.style.cssText = `background:${c.bg}; border-color:${c.border}; box-shadow:0 6px 0 ${c.shadow};`;
    btn.addEventListener('click', () => handleAnswer(btn, letter));
    container.appendChild(btn);
  });
}

function handleAnswer(btn, letter) {
  if (btn.disabled || btn.classList.contains('wrong') || btn.classList.contains('correct')) return;

  const correct = current.word[current.blankPos];
  if (letter === correct) {
    btn.classList.add('correct');
    document.querySelectorAll('.missing-btn').forEach(b => b.disabled = true);

    // Reveal the blank
    const blankBox = document.getElementById('blank-box');
    if (blankBox) {
      blankBox.textContent = correct;
      blankBox.classList.remove('missing-box-blank');
      blankBox.classList.add('missing-box-reveal');
    }

    score++;
    document.getElementById('score').textContent = score;
    hideTryAgainMsg(); hideHint();
    spawnConfetti(); playSound('correct');
    spellOutWord(current.word);
    const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    roundNum++;
    setTimeout(() => {
      showFeedbackOverlay(p[0], p[1], `${current.emoji}  ${current.word}!`, '#3498DB', 2200, nextQuestion);
    }, 600);
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
    score === ROUNDS ? 'You found every missing letter! 🏆' : 'Great spelling! Play again! 🔄',
    '#3498DB', 3500, restartGame);
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
  document.querySelectorAll('.missing-btn.hint-glow').forEach(b => b.classList.remove('hint-glow'));
}
function activateHint() {
  playSound('hint');
  sayWordTwice(current.word);
  const correct = current.word[current.blankPos];
  document.querySelectorAll('.missing-btn').forEach(btn => {
    if (!btn.disabled && btn.dataset.letter === correct)
      btn.classList.add('hint-glow');
  });
}

function generateQueue() {
  return shuffle([...TRACE_WORDS]).slice(0, ROUNDS).map(item => ({
    ...item,
    blankPos: Math.floor(Math.random() * item.word.length),
  }));
}

function restartGame() {
  score = 0; roundNum = 0;
  document.getElementById('score').textContent = 0;
  queue = generateQueue();
  nextQuestion();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('hint-btn').addEventListener('click', () => { activateHint(); playSound('hint'); });
  document.getElementById('missing-sound-btn').addEventListener('click', () => {
    if (!current) return;
    const btn = document.getElementById('missing-sound-btn');
    btn.classList.remove('sound-pop'); void btn.offsetWidth; btn.classList.add('sound-pop');
    sayWordTwice(current.word);
  });
  restartGame();
});
