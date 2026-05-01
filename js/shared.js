// ── Data ─────────────────────────────────────────────────────────────────────

const ITEMS = [
  {letter:'A',emoji:'🍎',word:'Apple'},  {letter:'B',emoji:'🐝',word:'Bee'},
  {letter:'C',emoji:'🐱',word:'Cat'},    {letter:'D',emoji:'🐶',word:'Dog'},
  {letter:'E',emoji:'🥚',word:'Egg'},    {letter:'F',emoji:'🐸',word:'Frog'},
  {letter:'G',emoji:'🍇',word:'Grapes'}, {letter:'H',emoji:'🏠',word:'House'},
  {letter:'I',emoji:'🍦',word:'Ice cream'},{letter:'J',emoji:'🃏',word:'Joker'},
  {letter:'K',emoji:'🪁',word:'Kite'},   {letter:'L',emoji:'🦁',word:'Lion'},
  {letter:'M',emoji:'🌙',word:'Moon'},   {letter:'N',emoji:'🌰',word:'Nut'},
  {letter:'O',emoji:'🦉',word:'Owl'},    {letter:'P',emoji:'🐧',word:'Penguin'},
  {letter:'Q',emoji:'👸',word:'Queen'},  {letter:'R',emoji:'🌈',word:'Rainbow'},
  {letter:'S',emoji:'⭐',word:'Star'},   {letter:'T',emoji:'🐢',word:'Turtle'},
  {letter:'U',emoji:'☂️',word:'Umbrella'},{letter:'V',emoji:'🎻',word:'Violin'},
  {letter:'W',emoji:'🐋',word:'Whale'},  {letter:'X',emoji:'🎄',word:'Xmas tree'},
  {letter:'Y',emoji:'🪀',word:'Yo-yo'},  {letter:'Z',emoji:'🦓',word:'Zebra'},
];

const TRACE_WORDS = [
  {word:'CAT',emoji:'🐱'}, {word:'DOG',emoji:'🐶'}, {word:'SUN',emoji:'☀️'},
  {word:'HAT',emoji:'🎩'}, {word:'PIG',emoji:'🐷'}, {word:'BUS',emoji:'🚌'},
  {word:'CUP',emoji:'☕'}, {word:'HEN',emoji:'🐔'}, {word:'ANT',emoji:'🐜'},
  {word:'OWL',emoji:'🦉'}, {word:'BEE',emoji:'🐝'}, {word:'MAP',emoji:'🗺️'},
  {word:'JAM',emoji:'🍓'}, {word:'NET',emoji:'🥅'}, {word:'POT',emoji:'🪴'},
];

const COLORS = ['#FF6B6B','#FF8C42','#A569BD','#2E86C1','#28B463','#D4A017','#E91E8C'];

const PRAISE = [
  ['🎉','Amazing!','You got it!'],   ['⭐','Superstar!','That\'s right!'],
  ['🌈','Wonderful!','Keep going!'], ['🎊','Brilliant!','You\'re so smart!'],
  ['🦄','Fantastic!','High five! ✋'],['🏆','Perfect!','You rock! 🎸'],
  ['🌟','Great job!','Yes, yes, yes!'],
];

const ENCOURAGE = [
  "Oops! Try another one! 💪", "Not that one! Keep looking! 🔍",
  "Almost! You can do it! 🌟",  "Try again — you've got this! 😊",
  "Look at the letter! Try again! 🔤", "Don't give up! Keep trying! 🚀",
];

// ── Audio ─────────────────────────────────────────────────────────────────────

let soundEnabled = true, audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq, t, dur, type = 'sine', vol = 0.25) {
  const ctx = getAudioCtx(), osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.start(t); osc.stop(t + dur);
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx(), now = ctx.currentTime;
    if      (type === 'correct')    { [523,659,784,1047].forEach((f,i) => playTone(f, now+i*0.13, 0.4, 'sine', 0.22)); }
    else if (type === 'wrong')      { playTone(350,now,0.15,'sine',0.18); playTone(270,now+0.15,0.2,'sine',0.15); }
    else if (type === 'fanfare')    { [523,659,784,659,784,1047].forEach((f,i) => playTone(f, now+i*0.12, 0.25, 'triangle', 0.25)); }
    else if (type === 'hint')       { playTone(880,now,0.1,'sine',0.15); playTone(1100,now+0.12,0.15,'sine',0.12); }
    else if (type === 'letter-done'){ playTone(523,now,0.12,'sine',0.2); playTone(784,now+0.13,0.18,'sine',0.2); }
  } catch(e) {}
}

function sayLetter(l) {
  if (!soundEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(l);
  u.rate = 0.75; u.pitch = 1.3; u.volume = 1;
  window.speechSynthesis.speak(u);
}

function sayWord(w) {
  if (!soundEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(w);
  u.rate = 0.85; u.pitch = 1.2; u.volume = 1;
  window.speechSynthesis.speak(u);
}

function spellOutWord(word) {
  if (!soundEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const STEP = 700;
  word.split('').forEach((letter, i) => {
    setTimeout(() => {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(letter);
      u.rate = 0.75; u.pitch = 1.3; u.volume = 1;
      window.speechSynthesis.speak(u);
    }, i * STEP);
  });
  setTimeout(() => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word.toLowerCase());
    u.rate = 0.85; u.pitch = 1.2; u.volume = 1;
    window.speechSynthesis.speak(u);
  }, word.length * STEP + 400);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function spawnConfetti() {
  const colors = ['#FF6B6B','#FFB347','#FDFD96','#5CB85C','#5BC0DE','#D7BDE2','#FF69B4'];
  for (let i = 0; i < 32; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-piece';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.top = '-20px';
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDelay = Math.random() * 0.6 + 's';
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    c.style.width = c.style.height = (8 + Math.random() * 10) + 'px';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 2200);
  }
}

function showFeedbackOverlay(emoji, msg, sub, color, duration, onDone) {
  const fb = document.getElementById('feedback');
  document.getElementById('fb-emoji').textContent = emoji;
  document.getElementById('fb-msg').textContent   = msg;
  document.getElementById('fb-msg').style.color   = color || '#FF6B6B';
  document.getElementById('fb-sub').textContent   = sub || '';
  fb.classList.add('show');
  setTimeout(() => { fb.classList.remove('show'); if (onDone) onDone(); }, duration || 1800);
}

// ── Sound toggle (shared across all game pages) ───────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('sound-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      btn.textContent = soundEnabled ? '🔊' : '🔇';
      if (soundEnabled) playSound('hint');
    });
  }
});
