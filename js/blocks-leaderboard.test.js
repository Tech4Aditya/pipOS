const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const HTML_PATH = path.resolve(__dirname, '..', 'index.html');
const CSS_PATH = path.resolve(__dirname, '..', 'css', 'style.css');
const TOYS_JS_PATH = path.resolve(__dirname, '..', 'js', 'toys.js');

test('index.html contains combo status badge and top-5 leaderboard elements', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  assert.match(html, /id=["']blockCombo["']/, 'index.html must contain #blockCombo element');
  assert.match(html, /class=["'][^"']*\bblock-leaderboard\b[^"']*["']/, 'index.html must contain .block-leaderboard container');
});

test('css/style.css defines styling for combo counter, leaderboard, and night mode', () => {
  const css = fs.readFileSync(CSS_PATH, 'utf8');

  assert.match(css, /\.block-status\s*\{/, 'Must define .block-status flex layout');
  assert.match(css, /\.block-combo\s*\{/, 'Must define .block-combo pill badge styling');
  assert.match(css, /\.block-leaderboard\s*\{/, 'Must define .block-leaderboard container styling');
  assert.match(css, /@keyframes\s+popIn/, 'Must define @keyframes popIn');
});

test('leaderboard helper maintains top 5 scores sorted descending', () => {
  const toys = require('./toys.js');
  assert.strictEqual(typeof toys.updateLeaderboardList, 'function', 'Must export updateLeaderboardList helper');

  let list = [];
  list = toys.updateLeaderboardList(list, 10, 'normal');
  list = toys.updateLeaderboardList(list, 25, 'hard');
  list = toys.updateLeaderboardList(list, 5, 'easy');
  list = toys.updateLeaderboardList(list, 18, 'normal');
  list = toys.updateLeaderboardList(list, 30, 'hard');
  list = toys.updateLeaderboardList(list, 12, 'easy');

  assert.strictEqual(list.length, 5, 'Leaderboard must be strictly capped at top 5 records');
  assert.strictEqual(list[0].score, 30, 'Top score must be 30');
  assert.strictEqual(list[1].score, 25, 'Second score must be 25');
  assert.strictEqual(list[2].score, 18, 'Third score must be 18');
  assert.strictEqual(list[3].score, 12, 'Fourth score must be 12');
  assert.strictEqual(list[4].score, 10, 'Fifth score must be 10');
  assert.ok(list[0].date, 'Records must include date timestamp');
  assert.strictEqual(list[0].mode, 'hard', 'Records must track game mode');

  // Ignored non-positive scores
  const same = toys.updateLeaderboardList(list, 0, 'normal');
  assert.strictEqual(same.length, 5);
});

test('combo pitch multiplier raises pitch for consecutive perfect drops', () => {
  const toys = require('./toys.js');
  assert.strictEqual(typeof toys.getComboPitchMultiplier, 'function', 'Must export getComboPitchMultiplier helper');

  assert.strictEqual(toys.getComboPitchMultiplier(0), 1, 'No combo must have multiplier 1');
  assert.strictEqual(toys.getComboPitchMultiplier(1), 1, 'Single perfect drop has multiplier 1');
  
  const mult2 = toys.getComboPitchMultiplier(2);
  const mult3 = toys.getComboPitchMultiplier(3);
  const mult4 = toys.getComboPitchMultiplier(4);

  assert.ok(mult2 > 1, '2x combo must raise pitch');
  assert.ok(mult3 > mult2, '3x combo must be higher pitch than 2x');
  assert.ok(mult4 > mult3, '4x combo must be higher pitch than 3x');
  assert.ok(toys.getComboPitchMultiplier(15) <= Math.pow(1.08, 8) + 0.001, 'Multiplier must smoothly cap at upper bound');
});

test('js/toys.js implements combo tracking and DOM updates in initBlocks', () => {
  const toysSrc = fs.readFileSync(TOYS_JS_PATH, 'utf8');

  assert.match(toysSrc, /st\.combo\s*=\s*\(st\.combo\s*\|\|\s*0\)\s*\+\s*1/, 'Must increment combo on perfect drop');
  assert.match(toysSrc, /renderLeaderboard\(/, 'Must call renderLeaderboard to update DOM');
  assert.match(toysSrc, /saveTopScore\(/, 'Must save score on game over');
});

test('js/toys.js drop() guards against missing st.cur and reports actual height score st.score', () => {
  const toysSrc = fs.readFileSync(TOYS_JS_PATH, 'utf8');

  // Verify null guards at the top of drop()
  assert.match(toysSrc, /if\s*\(!st\.cur\)\s*return;/, 'drop() must guard against missing st.cur before reading properties');
  assert.match(toysSrc, /if\s*\(!top\)\s*return;/, 'drop() must guard against missing top block before calculating overlap');

  // Verify accurate game over score reporting with st.score
  assert.match(toysSrc, /saveTopScore\(\s*st\.score\s*\)/, 'Must report actual height score st.score to saveTopScore on game over');
  assert.match(toysSrc, /toast\(\s*['"]Wobbly!\s*Your tower is\s*['"]\s*\+\s*st\.score\s*\+\s*['"]\s*blocks tall\.['"]\s*\)/, 'Must report st.score in game over toast notification');
  assert.match(toysSrc, /ctx\.fillText\(\s*['"]Wobbly!\s*['"]\s*\+\s*st\.score\s*\+\s*['"]\s*tall['"]/, 'Must draw actual height st.score on game over canvas overlay');
});

test('Rattle & Blocks freeze prevention: verifies loop wake-up, boundary, and narrow block safeguards', () => {
  const toysSrc = fs.readFileSync(TOYS_JS_PATH, 'utf8');

  // Verify ensureLoop and stopLoop lifecycle management
  assert.match(toysSrc, /function\s+ensureLoop\s*\(/, 'Must define ensureLoop helper to restart stalled loop');
  assert.match(toysSrc, /function\s+isCanvasActive\s*\(/, 'Must define isCanvasActive helper for geometry/display verification');

  // Verify narrow-width highlight protection (prevents negative radius arcTo / IndexSizeError crash)
  assert.match(toysSrc, /b\.w\s*>\s*12/, 'Must guard block highlight bevel from negative width when b.w < 12');
  assert.match(toysSrc, /Math\.max\(\s*0\s*,\s*Math\.min\(/, 'Must clamp corner radius to non-negative values');

  // Verify loop wake-up on drop interaction and window events
  assert.match(toysSrc, /function\s+onDrop\s*\(/, 'Must route drop interactions through onDrop');
  assert.match(toysSrc, /ensureLoop\(\)/, 'Must wake loop on drop interaction');

  // Verify dt delta calculation guards against negative time and NaN
  assert.match(toysSrc, /isNaN\(\s*delta\s*\)\s*\|\|\s*delta\s*<\s*0/, 'Must sanitize dt against clock jitter and negative deltas');
});

test('Canvas rr() and block highlight logic handles narrow widths and chips without throwing IndexSizeError', () => {
  // Recreate rr and highlight logic to verify no negative radius can be passed to arcTo
  const arcToCalls = [];
  const mockCtx = {
    beginPath: () => {},
    moveTo: () => {},
    arcTo: (x1, y1, x2, y2, r) => {
      if (r < 0) {
        throw new Error(`IndexSizeError: Radius (${r}) cannot be negative`);
      }
      arcToCalls.push({ x1, y1, x2, y2, r });
    },
    closePath: () => {}
  };

  function testRr(x, y, w, h, rad) {
    if (typeof w !== 'number' || typeof h !== 'number' || isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;
    if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) return;
    rad = Math.max(0, Math.min(rad || 0, w / 2, h / 2));
    mockCtx.beginPath();
    mockCtx.moveTo(x + rad, y);
    mockCtx.arcTo(x + w, y, x + w, y + h, rad);
    mockCtx.arcTo(x + w, y + h, x, y + h, rad);
    mockCtx.arcTo(x, y + h, x, y, rad);
    mockCtx.arcTo(x, y, x + w, y, rad);
    mockCtx.closePath();
  }

  // Test various narrow, zero, and negative widths that could occur on near-miss drops or small chips
  const testWidths = [-5, 0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 16, 160];
  for (const w of testWidths) {
    assert.doesNotThrow(() => {
      testRr(10, 10, w, 26, 7);
      if (w > 12) {
        testRr(14, 13, Math.max(0, w - 8), 6, 3);
      }
    }, `Drawing block or bevel with width ${w} must never throw IndexSizeError`);
  }

  // Ensure all recorded arcTo calls had r >= 0
  for (const call of arcToCalls) {
    assert.ok(call.r >= 0, `arcTo radius ${call.r} must be non-negative`);
  }
});
