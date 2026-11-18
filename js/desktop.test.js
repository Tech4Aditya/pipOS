'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');

// Mock browser globals if running under node
if (typeof window === 'undefined') {
  global.window = {
    innerWidth: 1024,
    innerHeight: 768
  };
}
if (typeof document === 'undefined') {
  global.document = {
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };
}

const desktop = require('./desktop.js');

describe('Desktop Icon Grid & Context Menu', () => {
  test('snapToGrid aligns coordinates to standard desktop grid', () => {
    const p1 = desktop.snapToGrid(20, 20);
    assert.strictEqual(p1.col, 0);
    assert.strictEqual(p1.row, 0);
    assert.strictEqual(p1.x, 16);
    assert.strictEqual(p1.y, 16);

    const p2 = desktop.snapToGrid(105, 195);
    assert.strictEqual(p2.col, 1);
    assert.strictEqual(p2.row, 2);
    assert.strictEqual(p2.x, 16 + 84 * 1);
    assert.strictEqual(p2.y, 16 + 84 * 2);
  });

  test('arrangeIcons places icons in neat non-overlapping columns', () => {
    const icons = ['icon1', 'icon2', 'icon3', 'icon4', 'icon5', 'icon6'];
    const arranged = desktop.arrangeIcons(icons, 300, 84); // 300px height allows ~3 rows

    assert.strictEqual(arranged.length, 6);
    // First 3 icons should be col 0
    assert.strictEqual(arranged[0].col, 0);
    assert.strictEqual(arranged[1].col, 0);
    assert.strictEqual(arranged[2].col, 0);
    // Next 3 icons should be col 1
    assert.strictEqual(arranged[3].col, 1);
    assert.strictEqual(arranged[4].col, 1);
    assert.strictEqual(arranged[5].col, 1);
  });

  test('sortIcons sorts items alphabetically by key', () => {
    const icons = [
      { name: 'terminal.exe' },
      { name: 'blocks.exe' },
      { name: 'notes.exe' },
      { name: 'audio.exe' }
    ];
    const sorted = desktop.sortIcons(icons, 'name');
    assert.strictEqual(sorted[0].name, 'audio.exe');
    assert.strictEqual(sorted[1].name, 'blocks.exe');
    assert.strictEqual(sorted[2].name, 'notes.exe');
    assert.strictEqual(sorted[3].name, 'terminal.exe');
  });

  test('isBoxIntersecting performs accurate 2D AABB collision detection', () => {
    const boxA = { left: 10, top: 10, right: 50, bottom: 50 };
    const boxB = { left: 40, top: 40, right: 80, bottom: 80 }; // Overlaps
    const boxC = { left: 60, top: 60, right: 100, bottom: 100 }; // Separate

    assert.strictEqual(desktop.isBoxIntersecting(boxA, boxB), true);
    assert.strictEqual(desktop.isBoxIntersecting(boxA, boxC), false);
  });
});
