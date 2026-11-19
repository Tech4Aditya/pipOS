const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const memory = require('./memory.js');

describe('Celestial Memory Match 4x4 Mini-Game (pip-memory.exe)', () => {
  beforeEach(() => {
    memory.initGame();
  });

  test('initGame creates 16 cards with 8 distinct matching pairs', () => {
    const state = memory.getState();
    assert.strictEqual(state.cards.length, 16);
    assert.strictEqual(state.moves, 0);
    assert.strictEqual(state.matches, 0);
    assert.strictEqual(state.isWon, false);

    // Verify exactly 2 of each symbol index (0 through 7)
    const counts = {};
    state.cards.forEach(c => {
      counts[c.symIdx] = (counts[c.symIdx] || 0) + 1;
    });

    for (let i = 0; i < 8; i++) {
      assert.strictEqual(counts[i], 2, `Symbol index ${i} must appear exactly twice`);
    }
  });

  test('flipCard flips first card and updates flipped state', () => {
    const success = memory.flipCard(0);
    assert.strictEqual(success, true);

    const state = memory.getState();
    assert.strictEqual(state.cards[0].isFlipped, true);
    assert.strictEqual(state.cards[0].isMatched, false);
    assert.strictEqual(state.moves, 0); // moves count increments after 2nd flip
  });

  test('matching pair marks both cards as matched and increments matches', () => {
    const state = memory.getState();
    const firstSym = state.cards[0].symIdx;
    // Find the pair card
    let pairIdx = -1;
    for (let i = 1; i < state.cards.length; i++) {
      if (state.cards[i].symIdx === firstSym) {
        pairIdx = i;
        break;
      }
    }
    assert.ok(pairIdx > 0);

    memory.flipCard(0);
    memory.flipCard(pairIdx);

    const updated = memory.getState();
    assert.strictEqual(updated.moves, 1);
    assert.strictEqual(updated.matches, 1);
    assert.strictEqual(updated.cards[0].isMatched, true);
    assert.strictEqual(updated.cards[pairIdx].isMatched, true);
  });

  test('index.html contains #memoryWin window with grid, moves, timer, and script tag', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('id="memoryWin"'), 'index.html must include #memoryWin window');
    assert.ok(html.includes('id="memoryGrid"'), 'index.html must include #memoryGrid');
    assert.ok(html.includes('id="memoryMoves"'), 'index.html must include #memoryMoves');
    assert.ok(html.includes('id="memoryTimer"'), 'index.html must include #memoryTimer');
    assert.ok(html.includes('id="memoryRestartBtn"'), 'index.html must include #memoryRestartBtn');
    assert.ok(html.includes('src="js/memory.js"'), 'index.html must include js/memory.js script tag');
  });
});
