'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');

// Mock browser globals if running under node
if (typeof window === 'undefined') {
  global.window = {};
}
if (typeof document === 'undefined') {
  global.document = {
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    addEventListener: () => {}
  };
}

const sky = require('./constellations.js');

describe('Constellation Dream Cartographer (pip-sky.exe)', () => {
  test('CONSTELLATIONS catalog has valid structures with normalized [0, 1] coordinates', () => {
    assert.ok(Array.isArray(sky.CONSTELLATIONS));
    assert.ok(sky.CONSTELLATIONS.length >= 3);

    sky.CONSTELLATIONS.forEach((c) => {
      assert.ok(c.id, 'Must have unique id');
      assert.ok(c.name, 'Must have display name');
      assert.ok(c.lore, 'Must have lore text');
      assert.ok(Array.isArray(c.stars) && c.stars.length >= 3, 'Must have at least 3 stars');

      c.stars.forEach((s) => {
        assert.ok(s.x >= 0 && s.x <= 1, `Star x (${s.x}) must be normalized [0, 1]`);
        assert.ok(s.y >= 0 && s.y <= 1, `Star y (${s.y}) must be normalized [0, 1]`);
      });
    });
  });

  test('connectStar accepts sequential star indices and rejects out-of-order or duplicate connections', () => {
    sky.setConstellationIndex(0);
    sky.resetCurrent();
    assert.strictEqual(sky.isComplete(), false);

    // Connecting star 1 before star 0 should fail
    assert.strictEqual(sky.connectStar(1), false, 'Out-of-order star connection must fail');

    // Connect star 0 (first star)
    assert.strictEqual(sky.connectStar(0), true, 'First star must connect');

    // Reconnecting star 0 should fail
    assert.strictEqual(sky.connectStar(0), false, 'Duplicate star connection must fail');

    // Connect star 1
    assert.strictEqual(sky.connectStar(1), true);
  });

  test('completing all stars in constellation marks it complete and registers discovery', () => {
    sky.setConstellationIndex(0);
    sky.resetCurrent();
    const count = sky.getActiveConstellation().stars.length;

    for (let i = 0; i < count; i++) {
      assert.strictEqual(sky.connectStar(i), true);
    }

    assert.strictEqual(sky.isComplete(), true, 'All stars connected should complete constellation');
    const discovered = sky.getDiscovered();
    assert.strictEqual(discovered[sky.getActiveConstellation().id], true);
  });

  test('nextConstellation cycles through constellations and wraps around', () => {
    sky.setConstellationIndex(0);
    const total = sky.CONSTELLATIONS.length;

    for (let i = 0; i < total; i++) {
      assert.strictEqual(sky.getActiveConstellation().id, sky.CONSTELLATIONS[i].id);
      sky.nextConstellation();
    }
    // Should wrap back to 0
    assert.strictEqual(sky.getActiveConstellation().id, sky.CONSTELLATIONS[0].id);
  });
});
