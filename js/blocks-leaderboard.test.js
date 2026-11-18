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

test('js/toys.js draws dotted personal best ghost line (bestMarker) across canvas', () => {
  const toysSrc = fs.readFileSync(TOYS_JS_PATH, 'utf8');

  assert.match(toysSrc, /bestMarker\s*=\s*levelY\(best\)\s*\+\s*st\.cam/, 'Must calculate bestMarker at levelY(best) + st.cam');
  assert.match(toysSrc, /setLineDash\(\[\s*4\s*,\s*4\s*\]\)/, 'Must draw dotted/dashed line for ghost marker');
  assert.match(toysSrc, /Record Height:\s*['"]\s*\+\s*best/, 'Must display Record Height text marker');

  const toys = require('./toys.js');
  assert.strictEqual(typeof toys.getBestMarkerY, 'function', 'Must export getBestMarkerY helper');
  // levelY(i) = H - 10 - (i + 1) * BH; for H=420, BH=28, best=5, cam=0: 420 - 10 - 6*28 = 242
  assert.strictEqual(toys.getBestMarkerY(5, 0), 242);
  assert.strictEqual(toys.getBestMarkerY(5, 10), 252);
});

test('js/toys.js exports exportScores and importScores helper methods', () => {
  const toys = require('./toys.js');
  assert.strictEqual(typeof toys.exportScores, 'function', 'Must export exportScores helper');
  assert.strictEqual(typeof toys.importScores, 'function', 'Must export importScores helper');

  // Setup mock store
  const memStore = {};
  global.PIP = global.PIP || {};
  global.PIP.store = {
    get: (k, def) => (memStore[k] !== undefined ? memStore[k] : (def || '')),
    set: (k, v) => { memStore[k] = String(v); }
  };

  try {
    // Import scores via JSON string
    const sampleData = {
      game: 'rattle-and-blocks',
      best: 42,
      topScores: [42, 35, 28, 20, 15]
    };
    const importSuccess = toys.importScores(JSON.stringify(sampleData));
    assert.strictEqual(importSuccess, true, 'importScores must return true on success');
    assert.strictEqual(memStore['best'], '42', 'Must update best in store');
    assert.deepStrictEqual(JSON.parse(memStore['blockTopScores']), [42, 35, 28, 20, 15], 'Must update blockTopScores in store');

    // Export scores
    const exportedRaw = toys.exportScores();
    assert.strictEqual(typeof exportedRaw, 'string', 'exportScores must return JSON string');
    const exported = JSON.parse(exportedRaw);
    assert.strictEqual(exported.game, 'rattle-and-blocks');
    assert.strictEqual(exported.best, 42);
    assert.deepStrictEqual(exported.topScores, [42, 35, 28, 20, 15]);
    assert.ok(exported.exportedAt);

    // Import handles malformed input safely
    assert.strictEqual(toys.importScores("invalid json"), false, 'Must return false for invalid JSON');
    assert.strictEqual(toys.importScores(null), false, 'Must return false for null');
  } finally {
    delete global.PIP.store;
  }
});

test('terminal blocks command provides stats, export, and autocomplete', () => {
  const term = require('./terminal.js');
  assert.ok(term.COMMANDS.includes('blocks'), 'COMMANDS must include blocks');

  // Setup mock store and toys
  const memStore = {
    best: '25',
    blockTopScores: JSON.stringify([25, 18, 12])
  };
  global.PIP = global.PIP || {};
  global.PIP.store = {
    get: (k, def) => (memStore[k] !== undefined ? memStore[k] : (def || '')),
    set: (k, v) => { memStore[k] = String(v); }
  };
  global.PIP.toys = require('./toys.js');

  try {
    // blocks stats
    const statsRes = term.executeCommand('blocks stats');
    assert.ok(statsRes.ok);
    assert.match(statsRes.output, /Personal Best: 25 blocks/);
    assert.match(statsRes.output, /#1 — 25 pts/);

    // blocks export
    const exportRes = term.executeCommand('blocks export');
    assert.ok(exportRes.ok);
    const parsed = JSON.parse(exportRes.output);
    assert.strictEqual(parsed.best, 25);
    assert.deepStrictEqual(parsed.topScores, [25, 18, 12]);

    // Autocomplete
    const bloMatch = term.autocomplete('blo');
    assert.deepStrictEqual(bloMatch, ['blocks']);

    const blocksSub = term.autocomplete('blocks ');
    assert.deepStrictEqual(blocksSub, ['blocks stats', 'blocks export']);
  } finally {
    delete global.PIP.store;
    delete global.PIP.toys;
  }
});
