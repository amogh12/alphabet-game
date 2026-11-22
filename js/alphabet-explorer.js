let currentIndex = 0;
const TILE_COLORS = ['#FF6B6B','#FF8C42','#5CB85C','#2E86C1','#8E44AD','#E91E8C','#F39C12'];

function sayPhoneme(letter) {
  if (!soundEnabled) return;
  const a = new Audio(`audio/phonics/${letter.toLowerCase()}.mp3`);
  a.onerror = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(letter);
    u.rate = 0.6; u.pitch = 1.2; u.volume = 1;
    window.speechSynthesis.speak(u);
  };
  a.play().catch(() => {});
}

function buildAlphaStrip() {
  const container = document.getElementById('alpha-chips');
  ITEMS.forEach((item, i) => {
    const chip = document.createElement('button');
    chip.className = 'alpha-chip';
    chip.id = `chip-${i}`;
    chip.textContent = item.letter;
    chip.style.background = TILE_COLORS[i % TILE_COLORS.length];
    chip.addEventListener('click', () => goTo(i));
    container.appendChild(chip);
  });
}

function goTo(index) {
  currentIndex = index;
  const item = ITEMS[index];

  // Update letter card
  const letterEl = document.getElementById('explorer-letter');
  letterEl.textContent = item.letter;
  letterEl.style.color = '#fff';
  const card = document.getElementById('explorer-card');
  card.style.background = TILE_COLORS[index % TILE_COLORS.length];
  card.style.boxShadow = `0 10px 0 ${darken(TILE_COLORS[index % TILE_COLORS.length])}`;

  // Hide tap hint after first use
  document.getElementById('explorer-tap-hint').style.display = 'block';

  // Update example
  document.getElementById('explorer-emoji').textContent = item.emoji;
  document.getElementById('explorer-word').textContent =
    item.letter + item.word.slice(1).toLowerCase();

  // Update position label
  document.getElementById('explorer-position').textContent =
    `${index + 1} / 26`;

  // Update nav buttons
  document.getElementById('prev-btn').disabled = index === 0;
  document.getElementById('next-btn').disabled = index === 25;

  // Highlight active chip and scroll into view
  document.querySelectorAll('.alpha-chip').forEach((c, i) => {
    c.classList.toggle('active', i === index);
  });
  const activeChip = document.getElementById(`chip-${index}`);
  if (activeChip) activeChip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

  // Auto-play the phonics sound
  sayPhoneme(item.letter);
}

function darken(hex) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.max(0, (n >> 16) - 55);
  const g = Math.max(0, ((n >> 8) & 0xff) - 55);
  const b = Math.max(0, (n & 0xff) - 55);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

document.addEventListener('DOMContentLoaded', () => {
  buildAlphaStrip();

  document.getElementById('explorer-card').addEventListener('click', () => {
    document.getElementById('explorer-tap-hint').style.display = 'none';
    sayPhoneme(ITEMS[currentIndex].letter);
    // Bounce animation
    const card = document.getElementById('explorer-card');
    card.classList.remove('card-bounce');
    void card.offsetWidth;
    card.classList.add('card-bounce');
  });

  document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  });

  document.getElementById('next-btn').addEventListener('click', () => {
    if (currentIndex < 25) goTo(currentIndex + 1);
  });

  goTo(0);
});
