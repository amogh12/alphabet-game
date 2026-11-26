// Sound It Out! — CVC (consonant-vowel-consonant) decoding practice.
// Each round: tap letters to hear their sounds, slide the ball under the word to blend,
// the word is spoken and its picture pops up, then the next word appears.

const ROUNDS = 8;

// Decodable 3-letter words: short vowels, one sound per letter, clear emoji.
const PHONICS_WORDS = [
  // short a
  {word:'CAT',emoji:'🐱'}, {word:'HAT',emoji:'🎩'}, {word:'BAT',emoji:'🦇'}, {word:'RAT',emoji:'🐀'},
  {word:'MAP',emoji:'🗺️'}, {word:'JAM',emoji:'🍓'}, {word:'VAN',emoji:'🚐'}, {word:'CAN',emoji:'🥫'},
  {word:'BAG',emoji:'👜'}, {word:'CAP',emoji:'🧢'}, {word:'PAN',emoji:'🍳'},
  // short e
  {word:'HEN',emoji:'🐔'}, {word:'NET',emoji:'🥅'}, {word:'BED',emoji:'🛏️'}, {word:'PEN',emoji:'🖊️'},
  {word:'JET',emoji:'✈️'}, {word:'LEG',emoji:'🦵'}, {word:'WEB',emoji:'🕸️'}, {word:'TEN',emoji:'🔟'},
  {word:'RED',emoji:'🔴'},
  // short i
  {word:'PIG',emoji:'🐷'}, {word:'PIN',emoji:'📌'}, {word:'LIP',emoji:'👄'}, {word:'ZIP',emoji:'🤐'},
  {word:'SIX',emoji:'6️⃣'}, {word:'BIN',emoji:'🗑️'}, {word:'DIG',emoji:'⛏️'}, {word:'KID',emoji:'🧒'},
  // short o
  {word:'DOG',emoji:'🐶'}, {word:'POT',emoji:'🪴'}, {word:'FOX',emoji:'🦊'}, {word:'BOX',emoji:'📦'},
  {word:'LOG',emoji:'🪵'}, {word:'HOT',emoji:'🔥'},
  // short u
  {word:'SUN',emoji:'☀️'}, {word:'BUS',emoji:'🚌'}, {word:'CUP',emoji:'☕'}, {word:'BUG',emoji:'🐛'},
  {word:'NUT',emoji:'🥜'}, {word:'TUB',emoji:'🛁'}, {word:'HUG',emoji:'🤗'}, {word:'RUN',emoji:'🏃'},
];

const TILE_COLORS = ['#FF6B6B', '#FF8C42', '#5CB85C', '#2E86C1', '#8E44AD'];

let queue = [], current = null, score = 0, roundNum = 0;
let locked = false;         // true while an animation/transition is running
let blended = false;        // has the child blended this word yet?

// ── Audio ─────────────────────────────────────────────────────────────────────

const PHONICS_TTS = {
  A:'aah', B:'buh', C:'kuh', D:'duh', E:'eh', F:'ffff', G:'guh', H:'huh', I:'ih',
  J:'juh', K:'kuh', L:'llll', M:'mmmm', N:'nnnn', O:'aw', P:'puh', Q:'kwuh', R:'rrrr',
  S:'ssss', T:'tuh', U:'uh', V:'vvvv', W:'wuh', X:'ks', Y:'yuh', Z:'zzzz'
};

function sayPhoneme(letter) {
  if (!soundEnabled) return;
  const a = new Audio(`audio/phonics/${letter.toLowerCase()}.mp3`);
  a.onerror = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(PHONICS_TTS[letter.toUpperCase()] || letter);
    u.rate = 0.55; u.pitch = 1.2;
    window.speechSynthesis.speak(u);
  };
  a.play().catch(() => {});
}

// No per-word audio files exist, so use speech synthesis directly (keeps it in the gesture).
function sayTheWord(word) { sayWord(word.toLowerCase()); }

function darken(hex) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.max(0, (n >> 16) - 55);
  const g = Math.max(0, ((n >> 8) & 0xff) - 55);
  const b = Math.max(0, (n & 0xff) - 55);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function makeTile(letter, i) {
  const btn = document.createElement('button');
  btn.className = 'phonics-tile';
  const color = TILE_COLORS[i % TILE_COLORS.length];
  btn.style.background = color;
  btn.style.boxShadow = `0 7px 0 ${darken(color)}`;
  btn.innerHTML = `<span class="tile-letter">${letter.toLowerCase()}</span><span class="sound-dot"></span>`;
  btn.dataset.letter = letter;
  return btn;
}

function bounceTile(tile) {
  tile.classList.remove('tile-bounce');
  void tile.offsetWidth;
  tile.classList.add('tile-bounce');
}

// ── Round flow ────────────────────────────────────────────────────────────────

function buildProgress() {
  const el = document.getElementById('progress');
  el.innerHTML = '';
  for (let i = 0; i < ROUNDS; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i < roundNum ? ' done' : i === roundNum ? ' current' : '');
    el.appendChild(d);
  }
}

function setPrompt(text) { document.getElementById('phonics-hint-text').textContent = text; }

function nextQuestion() {
  if (roundNum >= ROUNDS) { showEnd(); return; }
  current = queue[roundNum];
  locked = false; blended = false;
  document.getElementById('round').textContent = roundNum + 1;

  const emojiEl = document.getElementById('phonics-emoji');
  emojiEl.classList.remove('reveal-pop');
  emojiEl.textContent = '❓';
  setPrompt('Tap each sound 👆 then slide your finger along the arrow!');

  const tilesEl = document.getElementById('letter-tiles');
  tilesEl.classList.remove('merged');
  tilesEl.innerHTML = '';
  current.word.split('').forEach((letter, i) => {
    const tile = makeTile(letter, i);
    tile.addEventListener('click', () => {
      if (locked) return;
      sayPhoneme(letter);
      bounceTile(tile);
    });
    tilesEl.appendChild(tile);
  });
  resetSlider();
  buildProgress();
}

// Blend slider: drag the ball along the arrow; each letter sounds as the ball passes under it.
let sliderDragging = false, sliderSounded = new Set(), sliderAuto = false, sliderStartX = 0, sliderMoved = false;

function resetSlider() {
  sliderDragging = false; sliderSounded = new Set(); sliderAuto = false;
  const ball = document.getElementById('blend-ball');
  ball.style.transition = 'none';
  ball.style.left = '0px';
  document.getElementById('blend-track').classList.remove('done');
  document.querySelectorAll('.phonics-tile').forEach(t => t.classList.remove('tile-active'));
}

function sliderGeometry() {
  const track = document.getElementById('blend-track');
  const ball = document.getElementById('blend-ball');
  const tr = track.getBoundingClientRect();
  return { tr, max: tr.width - ball.offsetWidth, half: ball.offsetWidth / 2 };
}

function moveSliderTo(clientX) {
  const { tr, max, half } = sliderGeometry();
  const x = Math.max(0, Math.min(max, clientX - tr.left - half));
  document.getElementById('blend-ball').style.left = x + 'px';
  const ballCenter = tr.left + x + half;

  const tiles = [...document.querySelectorAll('#letter-tiles .phonics-tile')];
  tiles.forEach((t, i) => {
    const r = t.getBoundingClientRect();
    const center = r.left + r.width / 2;
    // sound each letter in order as the ball reaches it
    if (ballCenter >= center - 6 && !sliderSounded.has(i) && sliderSounded.size === i) {
      sliderSounded.add(i);
      tiles.forEach(o => o.classList.remove('tile-active'));
      t.classList.add('tile-active');
      bounceTile(t);
      sayPhoneme(t.dataset.letter);
    }
  });
  return x >= max - 4;
}

function sliderStart(e) {
  if (locked || blended) return;
  sliderDragging = true; sliderSounded = new Set();
  document.getElementById('blend-ball').style.transition = 'none';
  e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
  sliderStartX = e.clientX; sliderMoved = false;
}

function sliderMove(e) {
  if (!sliderDragging) return;
  if (!sliderMoved && Math.abs(e.clientX - sliderStartX) < 10) return;   // still a tap
  sliderMoved = true;
  moveSliderTo(e.clientX);
}

function sliderEnd(e) {
  if (!sliderDragging) return;
  sliderDragging = false;
  const { max } = sliderGeometry();
  const x = parseFloat(document.getElementById('blend-ball').style.left) || 0;
  const tiles = document.querySelectorAll('#letter-tiles .phonics-tile');
  if (x >= max - 4 && sliderSounded.size === tiles.length) {
    finishBlend();                       // still inside the pointerup gesture → speech allowed
  } else if (!sliderMoved) {
    autoBlend();                         // a plain tap on the arrow: do it for them, slowly
  } else {
    // let go too early — roll the ball back so they can try again
    const ball = document.getElementById('blend-ball');
    ball.style.transition = 'left 0.35s ease';
    ball.style.left = '0px';
    tiles.forEach(t => t.classList.remove('tile-active'));
    sliderSounded = new Set();
    setPrompt('Keep sliding all the way to the end! 👉');
  }
}

function autoBlend() {
  if (locked || blended) return;
  locked = true;
  const tiles = [...document.querySelectorAll('#letter-tiles .phonics-tile')];
  const ball = document.getElementById('blend-ball');
  const { tr, max, half } = sliderGeometry();
  const STEP = 650;
  tiles.forEach((t, i) => {
    setTimeout(() => {
      const r = t.getBoundingClientRect();
      ball.style.transition = 'left 0.4s ease';
      ball.style.left = Math.max(0, Math.min(max, r.left + r.width / 2 - tr.left - half)) + 'px';
      tiles.forEach(o => o.classList.remove('tile-active'));
      t.classList.add('tile-active');
      bounceTile(t);
      sayPhoneme(t.dataset.letter);
    }, i * STEP);
  });
  setTimeout(() => {
    ball.style.left = max + 'px';
    locked = false;
    finishBlend();
  }, tiles.length * STEP + 300);
}

function finishBlend() {
  if (blended) return;
  blended = true;
  locked = true;
  window.speechSynthesis && window.speechSynthesis.cancel();
  sayTheWord(current.word);                  // spoken inside the gesture when the child slid
  document.getElementById('blend-track').classList.add('done');
  document.querySelectorAll('.phonics-tile').forEach(t => t.classList.remove('tile-active'));
  document.getElementById('letter-tiles').classList.add('merged');   // tiles slide together
  setPrompt(`${current.word.toLowerCase()}!`);
  setTimeout(revealPicture, 600);
}

function revealPicture() {
  const emojiEl = document.getElementById('phonics-emoji');
  emojiEl.textContent = current.emoji;
  void emojiEl.offsetWidth;
  emojiEl.classList.add('reveal-pop');
  spawnConfetti();
  playSound('correct');
  score++;
  document.getElementById('score').textContent = score;
  roundNum++;
  buildProgress();
  setTimeout(nextQuestion, 2200);            // next word appears on its own
}

function showEnd() {
  playSound('fanfare'); spawnConfetti(); spawnConfetti();
  showFeedbackOverlay('🎓', `🌟 ${score}/${ROUNDS}`, 'You read every word! 🏆',
    '#FF5722', 3500, restartGame);
}

function restartGame() {
  score = 0; roundNum = 0;
  document.getElementById('score').textContent = 0;
  queue = shuffle([...PHONICS_WORDS]).slice(0, ROUNDS);
  nextQuestion();
}

document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('blend-track');
  track.addEventListener('pointerdown', sliderStart);
  track.addEventListener('pointermove', sliderMove);
  track.addEventListener('pointerup', sliderEnd);
  track.addEventListener('pointercancel', sliderEnd);
  // tap the picture after it appears to hear the word again
  document.getElementById('phonics-emoji').addEventListener('click', () => {
    if (blended) sayTheWord(current.word);
  });
  restartGame();
});
