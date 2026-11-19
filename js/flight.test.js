const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const flight = require('./flight.js');

describe('Rooftop Dream Delivery Flight Mini-Game 2D (pip-flight.exe)', () => {
  beforeEach(() => {
    flight.initGame();
  });

  test('initGame initializes Pip with standard starting position and rooftops', () => {
    const state = flight.getState();
    assert.strictEqual(state.isPlaying, false);
    assert.strictEqual(state.isGameOver, false);
    assert.strictEqual(state.score, 0);
    assert.strictEqual(state.deliveries, 0);
    assert.strictEqual(state.pip.x, 70);
    assert.strictEqual(state.pip.y, 120);
    assert.ok(state.rooftopCount >= 3, 'Must seed initial rooftops');
  });

  test('flap activates playing state and applies upward vertical velocity', () => {
    const success = flight.flap();
    assert.strictEqual(success, true);

    const state = flight.getState();
    assert.strictEqual(state.isPlaying, true);
    assert.ok(state.pip.vy < 0, 'Vertical velocity must be upward (negative)');
  });

  test('step applies gravity and updates coordinates', () => {
    flight.flap();
    const initialY = flight.getState().pip.y;
    flight.step();
    const newY = flight.getState().pip.y;
    // Y changes according to velocity
    assert.notStrictEqual(initialY, newY);
  });

  test('index.html contains #flightWin window with canvas, score, deliveries, and script tag', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('id="flightWin"'), 'index.html must include #flightWin window');
    assert.ok(html.includes('id="flightCanvas"'), 'index.html must include #flightCanvas');
    assert.ok(html.includes('id="flightScore"'), 'index.html must include #flightScore');
    assert.ok(html.includes('id="flightDeliveries"'), 'index.html must include #flightDeliveries');
    assert.ok(html.includes('id="flightHigh"'), 'index.html must include #flightHigh');
    assert.ok(html.includes('src="js/flight.js"'), 'index.html must include js/flight.js script tag');
  });
});
