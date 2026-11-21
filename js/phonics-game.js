const PHONICS_TTS = {
  A:'aah', B:'buh', C:'kuh', D:'duh', E:'eh',
  F:'fff', G:'guh', H:'huh', I:'ih',  J:'juh',
  K:'kuh', L:'lll', M:'mmm', N:'nnn', O:'aw',
  P:'puh', Q:'kwuh',R:'rrr', S:'sss', T:'tuh',
  U:'uh',  V:'vvv', W:'wuh', X:'ksss',Y:'yuh', Z:'zzz'
};

const ROUNDS = 8;
let queue = [], current = null, score = 0, roundNum = 0, wrongCount = 0;
let blending = false;

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
  const file = `audio/phonics/${letter.toLowerCase()}.wav`;
  const a = new Audio(file);
  a.onerror = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(PHONICS_TTS[letter.toUpperCase()] || letter);
    u.rate = 0.55; u.pitch = 1.2; u.volume = 1;
    window.speechSynthesis.speak(u);
  };
  a.play().catch(() => {});
}

function sayWordAudio(word) {
  if (!soundEnabled) return;
  const file = `audio/phonics/${word.toLowerCase()}.wav`;
  const a = new Audio(file);
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

function nextQuestion() {
  if (roundNum >= ROUNDS) { showEnd(); return; }
  wrongCount = 0;
  blending = false;
  hideTryAgainMsg(); hideHint();

  current = queue[roundNum];
  document.getElementById('round').textContent = roundNum + 1;
  document.getElementById('phonics-emoji').textContent = current.emoji;
  document.getElementById('phonics-hint-text').textContent = 'Tap each letter!';

  const tileColors = ['#FF6B6B', '#FF8C42', '#5CB85C', '#2E86C1', '#8E44AD'];
  const container = document.getElementById('letter-tiles');
  container.innerHTML = '';
  current.word.split('').forEach((letter, i) => {
    const btn = document.createElement('button');
    btn.className = 'phonics-tile';
    const color = tileColors[i % tileColors.length];
    btn.style.background = color;
    btn.style.boxShadow = `0 7px 0 ${darken(color)}`;
    btn.textContent = letter;
    btn.addEventListener('click', () => {
      if (blending) return;
      sayPhoneme(letter);
      btn.classList.remove('tile-bounce');
      void btn.offsetWidth;
      btn.classList.add('tile-bounce');
    });
    container.appendChild(btn);
  });

  document.getElementById('blend-area').style.display = 'block';
  document.getElementById('phonics-quiz').style.display = 'none';
  document.getElementById('blend-btn').disabled = false;

  buildProgress();
  setTimeout(() => sayWordAudio(current.word.toLowerCase()), 500);
}

function doBlend() {
  if (blending) return;
  blending = true;
  document.getElementById('blend-btn').disabled = true;
  document.getElementById('phonics-hint-text').textContent = 'Listen carefully!';

  const letters = current.word.split('');
  const tiles = document.querySelectorAll('.phonics-tile');

  letters.forEach((letter, i) => {
    setTimeout(() => {
      tiles.forEach(t => t.classList.remove('tile-active'));
      if (tiles[i]) {
        tiles[i].classList.add('tile-active', 'tile-bounce');
      }
      sayPhoneme(letter);
    }, i * 520);
  });

  setTimeout(() => {
    tiles.forEach(t => t.classList.remove('tile-active'));
    window.speechSynthesis.cancel();
    sayWordAudio(current.word.toLowerCase());
    setTimeout(showQuiz, 950);
  }, letters.length * 520 + 420);
}

function showQuiz() {
  document.getElementById('blend-area').style.display = 'none';
  document.getElementById('phonics-quiz').style.display = 'block';
  document.getElementById('phonics-hint-text').textContent = 'Which picture?';
  document.getElementById('phonics-emoji').textContent = '❓';

  const pool = TRACE_WORDS.filter(w => w.word !== current.word);
  shuffle(pool);
  const options = shuffle([current, pool[0], pool[1], pool[2]]);

  const container = document.getElementById('phonics-quiz-answers');
  container.innerHTML = '';
  options.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn phonics-answer-btn';
    btn.setAttribute('data-word', item.word);
    btn.innerHTML = `<span class="emoji" style="font-size:clamp(2.8rem,12vw,4rem)">${item.emoji}</span>`;
    btn.addEventListener('click', () => handleQuizPick(btn, item));
    container.appendChild(btn);
  });
}

function handleQuizPick(btn, item) {
  if (btn.disabled || btn.classList.contains('wrong') || btn.classList.contains('correct')) return;
  if (item.word === current.word) {
    btn.classList.add('correct');
    document.querySelectorAll('.phonics-answer-btn').forEach(b => b.disabled = true);
    score++;
    document.getElementById('score').textContent = score;
    spawnConfetti(); playSound('correct');
    hideTryAgainMsg(); hideHint();
    document.getElementById('phonics-emoji').textContent = current.emoji;
    const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    roundNum++;
    setTimeout(() => {
      showFeedbackOverlay(p[0], p[1], `${current.emoji} ${current.word.toLowerCase()}!`, '#FF5722', 1800, nextQuestion);
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
  showFeedbackOverlay('🎓', `🌟 ${score}/${ROUNDS}`,
    score === ROUNDS ? 'You read every word! 🏆' : 'Great reading! Play again! 🔄',
    '#FF5722', 3500, restartGame);
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
  document.querySelectorAll('.phonics-answer-btn.hint-glow').forEach(b => b.classList.remove('hint-glow'));
}
function activateHint() {
  playSound('hint'); sayWordAudio(current.word.toLowerCase());
  document.querySelectorAll('.phonics-answer-btn').forEach(btn => {
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
  document.getElementById('blend-btn').addEventListener('click', doBlend);
  document.getElementById('hint-btn').addEventListener('click', () => { activateHint(); playSound('hint'); });
  restartGame();
});
