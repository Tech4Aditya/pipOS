const test = require('node:test');
const assert = require('node:assert/strict');
const { updateSpring, RATTLE_CONFIG } = require('./rattle.js');

test('Playable Rattle Toy: spring physics simulation', async (t) => {
  await t.test('converges toward targetAngle over multiple steps', () => {
    const state = {
      angle: 1.0,
      vAngle: 0,
      targetAngle: 0,
      x: 0,
      vx: 0,
      targetX: 0,
      y: 0,
      vy: 0,
      targetY: 0,
      isDragging: false,
      lastJingle: 0
    };

    // Run 60 simulation steps
    for (let i = 0; i < 60; i++) {
      updateSpring(state, 1);
    }

    assert.ok(Math.abs(state.angle) < 0.1, 'Angle must oscillate back near 0');
    assert.ok(Math.abs(state.vAngle) < 0.1, 'Angular velocity must dampen down');
  });

  await t.test('converges toward target displacement (x and y) over time', () => {
    const state = {
      angle: 0,
      vAngle: 0,
      targetAngle: 0,
      x: 50,
      vx: 0,
      targetX: 0,
      y: -30,
      vy: 0,
      targetY: 0,
      isDragging: false,
      lastJingle: 0
    };

    for (let i = 0; i < 80; i++) {
      updateSpring(state, 1);
    }

    assert.ok(Math.abs(state.x) < 2.0, 'X displacement must dampen near target');
    assert.ok(Math.abs(state.y) < 2.0, 'Y displacement must dampen near target');
  });

  await t.test('handles null or empty state safely', () => {
    assert.doesNotThrow(() => {
      updateSpring(null);
      updateSpring(undefined);
    });
  });
});

test('Playable Rattle Toy: configuration constants', () => {
  assert.ok(RATTLE_CONFIG.SPRING_K > 0, 'Spring constant must be positive');
  assert.ok(RATTLE_CONFIG.DAMPING > 0 && RATTLE_CONFIG.DAMPING < 1, 'Damping must be between 0 and 1');
  assert.ok(RATTLE_CONFIG.SHAKE_THRESHOLD >= 10, 'Shake threshold must be sensitive enough for phone shake');
  assert.ok(Array.isArray(RATTLE_CONFIG.JINGLE_FREQS), 'Jingle freqs must be an array');
  assert.strictEqual(RATTLE_CONFIG.JINGLE_FREQS.length >= 3, true, 'At least 3 chime harmonics');
});

test('Playable Rattle Toy: index.html markup and accessibility contract', () => {
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  assert.ok(html.includes('id="rattleToy"'), 'index.html must contain #rattleToy element');
  assert.ok(html.includes('id="rattleSvg"'), 'rattle SVG element must exist');
  assert.ok(html.includes('id="rattleShakeBtn"'), 'shake button must exist');
  assert.ok(html.includes('id="rattleSensorToggle"'), 'opt-in shake sensor toggle button must exist');
  assert.ok(html.includes('src="js/rattle.js"'), 'index.html must include js/rattle.js');
});
