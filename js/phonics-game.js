const ROUNDS = 8;
let queue = [], current = null, score = 0, roundNum = 0;
let blending = false;
let tappedIndices = new Set();   // tracks which tile positions have been tapped

function playAudioFile(src) {
  return new Promise(resolve => {
    const a = new Audio(src);
    a.onended = resolve;
    a.onerror = resolve;
    a.play().catch(resolve);
  });
}

function sayPhoneme(letter) {
  if (!soundEnabled) return;
  const a = new Audio(`audio/phonics/${letter.toLowerCase()}.mp3`);
  a.onerror = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const PHONICS_TTS = {
      A:'aah', B:'buh', C:'kuh', D:'duh', E:'eh', F:'ffffff', G:'guh',
      H:'huh', I:'ih', J:'juh', K:'kuh', L:'llll', M:'mmmm', N:'nnnn',
      O:'aw', P:'puh', Q:'kwuh', R:'rrrr', S:'sssss', T:'tuh', U:'uh',
      V:'vvvv', W:'wuh', X:'ksss', Y:'yuh', Z:'zzzz'
    };
    const u = new SpeechSynthesisUtterance(PHONICS_TTS[letter.toUpperCase()] || letter);
    u.rate = 0.55; u.pitch = 1.2; u.volume = 1;
    window.speechSynthesis.speak(u);
  };
  a.play().catch(() => {});
}

function sayWordAudio(word) {
  if (!soundEnabled) return;
  const a = new Audio(`audio/phonics/${word.toLowerCase()}.mp3`);
  a.onerror = () => sayWord(word);
  a.play().catch(() => sayWord(word));
}

function darken(hex) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.max(0, (n >> 16) - 55);
  const g = Math.max(0, ((n >> 8) & 0xff) - 55);
  const b = Math.max(0, (n & 0xff) - 55);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
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

function checkAllTapped() {
  if (tappedIndices.size < current.word.length) return;
  const btn = document.getElementById('blend-btn');
  btn.disabled = false;
  btn.classList.add('blend-ready');
  document.getElementById('phonics-hint-text').textContent = 'Now press Blend it! 👇';
}

function nextQuestion() {
  if (roundNum >= ROUNDS) { showEnd(); return; }
  blending = false;
  tappedIndices = new Set();

  current = queue[roundNum];
  document.getElementById('round').textContent = roundNum + 1;

  // Picture hidden — child must decode first
  const emojiEl = document.getElementById('phonics-emoji');
  emojiEl.textContent = '❓';
  emojiEl.classList.remove('reveal-pop');
  document.getElementById('phonics-hint-text').textContent = 'Tap each letter!';

  // Blend button disabled until all letters tapped
  const blendBtn = document.getElementById('blend-btn');
  blendBtn.disabled = true;
  blendBtn.classList.remove('blend-ready');

  // Build letter tiles
  const tileColors = ['#FF6B6B', '#FF8C42', '#5CB85C', '#2E86C1', '#8E44AD'];
  const container = document.getElementById('letter-tiles');
  container.innerHTML = '';
  current.word.split('').forEach((letter, i) => {
    const btn = document.createElement('button');
    btn.className = 'phonics-tile';
    const color = tileColors[i % tileColors.length];
    btn.style.background = color;
    btn.style.boxShadow = `0 7px 0 ${darken(color)}`;
    btn.textContent = letter.toUpperCase();
    btn.addEventListener('click', () => {
      if (blending) return;
      sayPhoneme(letter);
      btn.classList.remove('tile-bounce', 'tile-tapped');
      void btn.offsetWidth;
      btn.classList.add('tile-bounce', 'tile-tapped');
      tappedIndices.add(i);
      checkAllTapped();
    });
    container.appendChild(btn);
  });

  document.getElementById('blend-area').style.display = 'block';
  buildProgress();
}

function doBlend() {
  if (blending) return;
  blending = true;
  const btn = document.getElementById('blend-btn');
  btn.disabled = true;
  btn.classList.remove('blend-ready');
  document.getElementById('phonics-hint-text').textContent = 'Listen carefully…';

  const letters = current.word.split('');
  const tiles = document.querySelectorAll('.phonics-tile');

  // Play each phoneme with tile highlight
  letters.forEach((letter, i) => {
    setTimeout(() => {
      tiles.forEach(t => t.classList.remove('tile-active'));
      if (tiles[i]) tiles[i].classList.add('tile-active', 'tile-bounce');
      sayPhoneme(letter);
    }, i * 520);
  });

  // After all phonemes, play full word then reveal
  setTimeout(() => {
    tiles.forEach(t => t.classList.remove('tile-active'));
    window.speechSynthesis && window.speechSynthesis.cancel();
    sayWordAudio(current.word.toLowerCase());
    setTimeout(revealPicture, 950);
  }, letters.length * 520 + 420);
}

function revealPicture() {
  const emojiEl = document.getElementById('phonics-emoji');
  emojiEl.textContent = current.emoji;
  void emojiEl.offsetWidth;
  emojiEl.classList.add('reveal-pop');

  document.getElementById('phonics-hint-text').textContent =
    current.word.toLowerCase() + '!';

  spawnConfetti();
  playSound('correct');
  score++;
  document.getElementById('score').textContent = score;

  const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
  roundNum++;
  setTimeout(() => {
    showFeedbackOverlay(
      p[0], p[1],
      `${current.emoji} ${current.word.toLowerCase()}!`,
      '#FF5722', 2000, nextQuestion
    );
  }, 900);
}

function showEnd() {
  playSound('fanfare'); spawnConfetti(); spawnConfetti();
  showFeedbackOverlay('🎓', `🌟 ${score}/${ROUNDS}`,
    score === ROUNDS ? 'You read every word! 🏆' : 'Great reading! Play again! 🔄',
    '#FF5722', 3500, restartGame);
}

function restartGame() {
  score = 0; roundNum = 0;
  document.getElementById('score').textContent = 0;
  queue = shuffle([...TRACE_WORDS]).slice(0, ROUNDS);
  nextQuestion();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('blend-btn').addEventListener('click', doBlend);
  // Hint plays the word so child knows what they're decoding
  document.getElementById('hint-btn').addEventListener('click', () => {
    playSound('hint');
    sayWordAudio(current.word.toLowerCase());
  });
  restartGame();
});
