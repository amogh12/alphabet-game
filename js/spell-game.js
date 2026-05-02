const ROUNDS = 8;
let queue = [], current = null, score = 0, roundNum = 0, wrongCount = 0, currentPos = 0;

const TILE_COLORS = [
  { bg: '#FFF3E0', border: '#FF8C42', shadow: '#D4600A' },
  { bg: '#E8F5E9', border: '#28B463', shadow: '#1A7D44' },
  { bg: '#EDE7F6', border: '#9B59B6', shadow: '#703688' },
  { bg: '#E3F2FD', border: '#2E86C1', shadow: '#1A5F8E' },
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

function buildSlots() {
  const container = document.getElementById('spell-slots');
  container.innerHTML = '';
  for (let i = 0; i < current.word.length; i++) {
    const slot = document.createElement('div');
    slot.className = 'spell-slot';
    slot.id = `slot-${i}`;
    container.appendChild(slot);
  }
}

function getDistractor() {
  const wordLetters = current.word.split('');
  const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l => !wordLetters.includes(l));
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildTiles() {
  const container = document.getElementById('spell-tiles');
  container.innerHTML = '';
  const letters = shuffle([...current.word.split(''), getDistractor()]);
  letters.forEach((letter, i) => {
    const c = TILE_COLORS[i % TILE_COLORS.length];
    const btn = document.createElement('button');
    btn.className = 'spell-tile';
    btn.textContent = letter;
    btn.dataset.letter = letter;
    btn.setAttribute('aria-label', `Letter ${letter}`);
    btn.style.cssText = `background:${c.bg}; border-color:${c.border}; box-shadow:0 6px 0 ${c.shadow};`;
    btn.addEventListener('click', () => handleTile(btn, letter));
    container.appendChild(btn);
  });
}

function nextQuestion() {
  if (roundNum >= ROUNDS) { showEnd(); return; }
  wrongCount = 0; currentPos = 0;
  hideTryAgainMsg(); hideHint();

  current = queue[roundNum];
  document.getElementById('round').textContent = roundNum + 1;

  const emojiEl = document.getElementById('spell-emoji');
  emojiEl.textContent = current.emoji;
  emojiEl.classList.remove('pop'); void emojiEl.offsetWidth; emojiEl.classList.add('pop');

  document.getElementById('spell-word-label').textContent = current.word;

  buildSlots();
  buildTiles();
  buildProgress();

  const soundBtn = document.getElementById('spell-sound-btn');
  soundBtn.classList.remove('sound-pop'); void soundBtn.offsetWidth; soundBtn.classList.add('sound-pop');
  sayWordTwice(current.word);
}

function handleTile(btn, letter) {
  if (btn.disabled || btn.classList.contains('used')) return;

  const expected = current.word[currentPos];
  if (letter === expected) {
    btn.classList.add('used');
    btn.disabled = true;

    const slot = document.getElementById(`slot-${currentPos}`);
    slot.textContent = letter;
    slot.classList.add('filled');

    playSound('letter-done');
    hideTryAgainMsg();
    document.querySelectorAll('.spell-tile').forEach(b => b.classList.remove('hint-glow'));

    const isLast = currentPos + 1 === current.word.length;
    if (!isLast) sayLetter(letter);

    currentPos++;
    if (isLast) {
      score++;
      document.getElementById('score').textContent = score;
      hideHint();
      spawnConfetti(); playSound('correct');
      const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
      roundNum++;
      document.querySelectorAll('.spell-tile').forEach(b => b.disabled = true);
      spellOutWord(current.word);
      setTimeout(() => {
        showFeedbackOverlay(p[0], p[1], `${current.emoji}  ${current.word}!`, '#1ABC9C', 2200, nextQuestion);
      }, 600);
    }
  } else {
    btn.classList.remove('tile-shake'); void btn.offsetWidth; btn.classList.add('tile-shake');
    setTimeout(() => btn.classList.remove('tile-shake'), 400);
    wrongCount++; playSound('wrong'); showTryAgainMsg();
    if (wrongCount >= 1) showHint();
    if (wrongCount >= 2) activateHint();
  }
}

function showEnd() {
  playSound('fanfare'); spawnConfetti(); spawnConfetti();
  const stars = score >= ROUNDS ? '🌟🌟🌟' : score >= Math.ceil(ROUNDS * 0.7) ? '⭐⭐⭐' : score >= Math.ceil(ROUNDS * 0.5) ? '⭐⭐' : '⭐';
  showFeedbackOverlay('🎓', `${stars} ${score}/${ROUNDS}`,
    score === ROUNDS ? 'You can spell every word! 🏆' : 'Amazing spelling! Play again! 🔄',
    '#1ABC9C', 3500, restartGame);
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
  document.querySelectorAll('.spell-tile.hint-glow').forEach(b => b.classList.remove('hint-glow'));
}
function activateHint() {
  playSound('hint');
  sayWordTwice(current.word);
  const expected = current.word[currentPos];
  document.querySelectorAll('.spell-tile').forEach(btn => {
    if (!btn.disabled && btn.dataset.letter === expected)
      btn.classList.add('hint-glow');
  });
}

function restartGame() {
  score = 0; roundNum = 0; currentPos = 0;
  document.getElementById('score').textContent = 0;
  queue = shuffle([...TRACE_WORDS]).slice(0, ROUNDS);
  nextQuestion();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('hint-btn').addEventListener('click', () => { activateHint(); playSound('hint'); });
  document.getElementById('spell-sound-btn').addEventListener('click', () => {
    if (!current) return;
    const btn = document.getElementById('spell-sound-btn');
    btn.classList.remove('sound-pop'); void btn.offsetWidth; btn.classList.add('sound-pop');
    sayWordTwice(current.word);
  });
  restartGame();
});
