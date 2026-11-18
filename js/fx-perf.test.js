'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');

// Mock browser globals if running under node
if (typeof window === 'undefined') {
  global.window = {
    innerWidth: 1024,
    innerHeight: 768,
    devicePixelRatio: 2,
    addEventListener: () => {},
    requestAnimationFrame: (fn) => setTimeout(fn, 16)
  };
}
if (typeof document === 'undefined') {
  global.document = {
    documentElement: {
      getAttribute: () => 'off'
    },
    getElementById: () => null,
    addEventListener: () => {}
  };
}

const fx = require('./fx.js');

describe('Offscreen Batch Particle Pool Engine', () => {
  test('particle pool spawns active particles and tracks active count', () => {
    fx.clearParticles();
    const initialPool = fx.getPoolSize();

    const p = fx.spawnSparkle(100, 200, {
      vx: 1.5,
      vy: 2.0,
      glyph: '★',
      color: '#ffb454',
      size: 16,
      maxLife: 20
    });

    assert.ok(p, 'Particle should be spawned');
    assert.strictEqual(p.x, 100);
    assert.strictEqual(p.y, 200);
    assert.strictEqual(p.glyph, '★');
    assert.strictEqual(fx.getActiveCount(), 1);
    assert.strictEqual(fx.getPoolSize(), initialPool - 1, 'Pool size should decrease by 1');
  });

  test('updateParticles updates position and fades alpha', () => {
    fx.clearParticles();
    const p = fx.spawnSparkle(50, 50, { vx: 2, vy: 3, maxLife: 10 });
    assert.strictEqual(p.alpha, 1.0);

    // Advance 5 ticks (half life)
    fx.updateParticles(5);
    assert.strictEqual(p.x, 60); // 50 + 2*5
    assert.strictEqual(p.y, 65); // 50 + 3*5
    assert.strictEqual(p.alpha, 0.5);
    assert.strictEqual(fx.getActiveCount(), 1);
  });

  test('expired particles are recycled back into pool with zero leaks', () => {
    fx.clearParticles();
    const startPool = fx.getPoolSize();

    fx.spawnSparkle(10, 10, { maxLife: 5 });
    fx.spawnSparkle(20, 20, { maxLife: 5 });
    assert.strictEqual(fx.getActiveCount(), 2);

    // Advance past maxLife
    fx.updateParticles(10);
    assert.strictEqual(fx.getActiveCount(), 0, 'All particles should expire');
    assert.strictEqual(fx.getPoolSize(), startPool, 'Pool should receive recycled particles');
  });

  test('renderParticles performs batch canvas operations without throwing', () => {
    fx.clearParticles();
    fx.spawnSparkle(150, 250);

    const calls = [];
    const mockCtx = {
      clearRect: (...args) => calls.push(['clearRect', ...args]),
      save: () => calls.push(['save']),
      restore: () => calls.push(['restore']),
      translate: (...args) => calls.push(['translate', ...args]),
      rotate: (...args) => calls.push(['rotate', ...args]),
      fillText: (...args) => calls.push(['fillText', ...args]),
      font: '',
      textAlign: '',
      textBaseline: '',
      fillStyle: '',
      shadowColor: '',
      shadowBlur: 0,
      globalAlpha: 1
    };

    fx.renderParticles(mockCtx, 800, 600);
    assert.ok(calls.some(c => c[0] === 'clearRect'));
    assert.ok(calls.some(c => c[0] === 'fillText'));
    fx.clearParticles();
  });

  test('pool enforces maximum capacity boundary', () => {
    fx.clearParticles();
    for (let i = 0; i < 70; i++) {
      fx.spawnSparkle(i, i);
    }
    assert.ok(fx.getActiveCount() <= 64, 'Active particles should be capped at MAX_POOL (64)');
    fx.clearParticles();
  });
});
