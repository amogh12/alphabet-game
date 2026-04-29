# ABC Fun! — Project Reference

> **Keep this file current.** After adding or changing anything significant, update the relevant section.  
> Goal: every new session can start here and never need to re-read styles.css, shared.js, or existing game files.

---

## Stack

- Pure **HTML / CSS / JS** — no framework, no build step, no npm
- Single CSS file: `css/styles.css`
- Shared utilities: `js/shared.js` (loaded before every game script)
- Google Fonts: Fredoka One (headings) + Nunito (body)
- Web Audio API for sound effects
- Web Speech Synthesis API for spoken words/numbers/emotions
- Target audience: **3–5 year olds** on tablet/phone

---

## File Map

```
index.html                  ← Home screen (all game cards live here)
css/styles.css              ← ALL styles, one file, sectioned by game
js/shared.js                ← Globals: data, audio, helpers (see API below)

letter-game.html / js/letter-game.js        🔤 ABC Game
trace-game.html  / js/trace-game.js         ✏️  Trace Words
sounds-game.html / js/sounds-game.js        🔊 Letter Sounds
count-game.html  / js/count-game.js         🍎 Count & Tap
sequence-game.html / js/sequence-game.js    🔢 Fill the Gap
match-game.html  / js/match-game.js         🃏 Number Match (not on home screen, kept as file)
pop-game.html    / js/pop-game.js           🎈 Pop the Number
more-game.html   / js/more-game.js          ⚖️  More or Less
shapes-game.html / js/shapes-game.js        🔷 Shape Sorter
patterns-game.html / js/patterns-game.js    🔁 Patterns
emotions-game.html / js/emotions-game.js    😊 Feelings
color-game.html  / js/color-game.js         🌈 Color Pop
first-letter-game.html / js/first-letter-game.js  🔡 First Letter
shape-pop-game.html   / js/shape-pop-game.js        🔵 Shape Pop
shape-match-game.html / js/shape-match-game.js      🔶 Shape Match
```

---

## Home Screen Sections (index.html)

| Section | Games |
|---|---|
| 🔤 Letters | ABC Game, Trace Words, Letter Sounds, First Letter |
| 🔢 Numbers | Count & Tap, Pop the Number, Fill the Gap, More or Less |
| 😊 Feelings | Feelings |
| 🌈 Colors | Color Pop |
| 🔷 Shapes & Patterns | Shape Sorter, Shape Pop, Shape Match, Patterns |

---

## shared.js — Full API

**Data globals** (read-only, used by game scripts):
```js
ITEMS        // Array of 26 objects: { letter, emoji, word } — A=Apple, B=Bee, …
TRACE_WORDS  // Array of 15 objects: { word, emoji } — 3-letter words for tracing
COLORS       // Array of 7 hex strings for coloring things
PRAISE       // Array of [emoji, title, sub] — pick random for correct-answer overlay
ENCOURAGE    // Array of strings — pick random for wrong-answer "try again" message
soundEnabled // Boolean, toggled by the 🔊 button in the header
```

**Audio functions:**
```js
playSound(type)         // type: 'correct' | 'wrong' | 'fanfare' | 'hint' | 'letter-done'
sayLetter(l)            // speaks a single letter slowly (rate 0.75, pitch 1.3)
sayWord(w)              // speaks a word (rate 0.85, pitch 1.2)
```

**UI helpers:**
```js
shuffle(arr)                                      // Fisher-Yates in-place, returns arr
spawnConfetti()                                   // 32 confetti pieces from top
showFeedbackOverlay(emoji, msg, sub, color, duration, onDone)
  // Shows #feedback overlay, auto-hides after `duration` ms, then calls onDone()
  // Always check soundEnabled before calling speechSynthesis
```

**DOM wired by shared.js:**
- `#sound-toggle` button — toggles `soundEnabled`, updates icon 🔊/🔇

---

## Every Game — Standard Structure

### HTML shell
```html
<body class="THEME-theme">
  <button id="sound-toggle">🔊</button>
  <a id="back-btn" href="index.html">← Home</a>
  <header><h1>…</h1><p>…</p></header>
  <div id="scorebar">
    <div class="score-pill">⭐ <span id="score">0</span></div>
    <div class="score-pill">🎯 Round <span id="round">1</span></div>
  </div>
  <div id="game">
    <div id="progress" class="dots-row"></div>
    <!-- game-specific card + play area here -->
    <div id="try-again-msg"></div>
    <div id="hint-area"><button id="hint-btn">💡 Hint</button></div>
  </div>
  <div id="feedback" role="dialog" aria-modal="true">
    <div class="fb-emoji" id="fb-emoji">🎉</div>
    <div class="fb-msg"   id="fb-msg">Yay!</div>
    <div class="fb-sub"   id="fb-sub"></div>
  </div>
  <script src="js/shared.js"></script>
  <script src="js/GAME-game.js"></script>
</body>
```

### JS shell (copy-paste starting point)
```js
const ROUNDS = 8;
let queue = [], current = null, score = 0, roundNum = 0, wrongCount = 0;

function buildProgress() { /* dots: done/current/pending */ }
function nextQuestion()  { /* load queue[roundNum], render, say audio */ }
function handlePick(…)   {
  // CORRECT: add .correct, disable all, score++, spawnConfetti, playSound('correct'),
  //          roundNum++, setTimeout → showFeedbackOverlay → nextQuestion
  // WRONG:   add .wrong, disable btn, wrongCount++, playSound('wrong'), showTryAgainMsg()
  //          wrongCount >= 1 → showHint(); wrongCount >= 2 → activateHint()
}
function showEnd()        { playSound('fanfare'); spawnConfetti×2; showFeedbackOverlay → restartGame }
function showTryAgainMsg(){ /* ENCOURAGE[random] → #try-again-msg.show */ }
function hideTryAgainMsg(){ /* remove .show */ }
function showHint()       { /* #hint-btn.visible */ }
function hideHint()       { /* remove .visible, remove .hint-glow from answer btns */ }
function activateHint()   { /* playSound('hint'), say audio again, add .hint-glow to correct btn */ }
function restartGame()    { score=0; roundNum=0; queue=generateQueue(); nextQuestion(); }

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('hint-btn').addEventListener('click', () => { activateHint(); playSound('hint'); });
  restartGame();
});
```

### Wrong-answer mechanic (NEVER skip)
- Wrong button gets `.wrong` class + `disabled = true` — stays visible but faded
- User **must find the correct answer** — the round does not advance on wrong
- **Do NOT complete or skip on wrong** — this is intentional UX for 3-5 yr olds

---

## CSS Conventions

### Themes (body class)
Each game has a unique `body.THEME-theme` that sets background gradients and `header h1` color.

| Game | body class | Primary color | Home card stripe |
|---|---|---|---|
| Letter Game | *(default)* | #FF6B6B | #FF6B6B |
| Trace | *(default)* | #5CB85C | #5CB85C |
| Letter Sounds | sounds-theme | #E91E8C | #E91E8C |
| Count & Tap | number-theme | #9B59B6 | #F39C12 |
| Fill the Gap | number-theme | #2E86C1 | #2E86C1 |
| Pop the Number | pop-theme | #FF8C42 | #FF8C42 |
| More or Less | more-theme | #8E44AD | #8E44AD |
| Shape Sorter | shapes-theme | #16A085 | #16A085 |
| Patterns | patterns-theme | #E67E22 | #E67E22 |
| Feelings | emotions-theme | #FF6B9D | #FF6B9D |
| Color Pop | colors-theme | #9B59B6 | #9B59B6 |
| First Letter | first-theme | #F39C12 | #F39C12 |
| Shape Pop   | shape-pop-theme   | #16A085 | #16A085 |
| Shape Match | shape-match-theme | #8E44AD | #8E44AD |

### Answer button states
```css
.answer-btn          /* default */
.answer-btn.correct  /* green bg + border, wiggle animation */
.answer-btn.wrong    /* red bg + border, shake animation, opacity 0.65 */
.answer-btn.hint-glow/* orange border, pulse-hint animation */
```
Same pattern for `.num-btn`, `.side-btn`, `.emotion-btn`, `.pop-bubble`.

### Key animations (defined once, reused everywhere)
```css
pop          /* scale in from 0 — used for item entrance */
wiggle       /* correct answer celebration */
shake        /* wrong answer */
bounce       /* feedback overlay emoji */
big-bounce   /* correct answer emoji */
pulse-hint   /* hint glow */
confetti-fall/* confetti pieces */
float-bubble /* pop game bubbles */
bubble-pop   /* bubble disappear on correct */
sound-pop    /* 🔊 button press feedback */
```

### Adding a home screen card
```html
<a class="mode-card THEME" href="GAME-game.html">
  <span class="mode-emoji">EMOJI</span>
  <span class="mode-label">Name</span>
  <span class="mode-desc">Short description</span>
</a>
```
Add `.mode-card.THEME::before { background: COLOR; }` to styles.css.  
Cards with an odd count in a grid auto-span full width via:  
`.mode-grid .mode-card:last-child:nth-child(odd) { grid-column: 1 / -1; }`

---

## Speech Synthesis — Critical Rules

1. **Must be called synchronously within a user-gesture handler** (click, tap). Never wrap the first `speak()` call in a `setTimeout`.
2. **Always call `window.speechSynthesis.cancel()` first** to clear any queued speech.
3. **Single utterance is more reliable than chained utterances** in Chrome (no inter-utterance gaps). Join array as `nums.join(', ')` for sequences.
4. **`onend` callback is unreliable in Chrome** for long utterances — use fixed `setTimeout` timing instead for anything timing-dependent.
5. **Say things twice** (like Pop the Number, Feelings) pattern:
   ```js
   const u1 = speak();
   u1.onend = () => setTimeout(() => window.speechSynthesis.speak(speak()), 600);
   window.speechSynthesis.speak(u1);
   ```
6. **Preview/sandboxed browsers have no audio** — test speech on a real device or real browser.

---

## Checklist — Adding a New Game

- [ ] Create `GAME-game.html` (copy shell above, set body class)
- [ ] Create `js/GAME-game.js` (copy JS shell above)
- [ ] Add CSS section to `css/styles.css` (theme + game-specific components)
- [ ] Add `.mode-card.THEME::before` stripe color to styles.css
- [ ] Add card to correct section in `index.html`
- [ ] **Update this CLAUDE.md** — file map, home screen table, theme table

---

## Gotchas & Decisions Log

| Topic | Decision |
|---|---|
| Wrong answer | Never auto-advance; button stays disabled, user finds correct one |
| Hint timing | Show hint button after 1st wrong; activate (glow + audio) after 2nd wrong |
| ROUNDS | Always 8 per game |
| Number range | 1–9 (single digit only, fits kids' attention) |
| match-game.html | Kept on disk, removed from home screen (replaced by Pop the Number) |
| Speech in setTimeout | Breaks user-gesture context in some browsers — always call speak() directly in handler |
| Sequence readout | Single utterance `nums.join(', ')` at rate=1.8; tile highlights at STEP=650ms independently |
| Capacitor/app store | Not started — ~3-4 weeks effort, main blocker is replacing Web Speech API with native TTS plugin |
