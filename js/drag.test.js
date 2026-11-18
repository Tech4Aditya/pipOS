const test = require('node:test');
const assert = require('node:assert/strict');
const { clampCoordinates, MIN_DESKTOP_WIDTH } = require('./drag.js');
const fs = require('fs');
const path = require('path');

test('Draggable Windows: coordinate boundary clamping', async (t) => {
  await t.test('keeps coordinate unchanged when within safe viewport boundaries', () => {
    const res = clampCoordinates(100, 150, 300, 200, 1200, 800);
    assert.strictEqual(res.x, 100);
    assert.strictEqual(res.y, 150);
  });

  await t.test('clamps extreme left / negative x displacement', () => {
    const res = clampCoordinates(-5000, 0, 300, 200, 1200, 800);
    assert.ok(res.x > -1200, 'X coordinate must be clamped within viewport reach');
  });

  await t.test('clamps extreme right / positive x displacement', () => {
    const res = clampCoordinates(5000, 0, 300, 200, 1200, 800);
    assert.ok(res.x < 1200, 'X coordinate must be clamped within viewport reach');
  });

  await t.test('clamps extreme vertical y displacements', () => {
    const resTop = clampCoordinates(0, -9999, 300, 200, 1200, 800);
    const resBottom = clampCoordinates(0, 9999, 300, 200, 1200, 800);
    assert.strictEqual(resTop.y, -400);
    assert.strictEqual(resBottom.y, 600);
  });
});

test('Draggable Windows: configuration constants', () => {
  assert.strictEqual(MIN_DESKTOP_WIDTH, 900, 'Desktop dragging must be reserved for screens >= 900px');
});

test('Draggable Windows: index.html markup and script loading', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  assert.ok(html.includes('id="resetLayoutBtn"'), 'index.html must include #resetLayoutBtn');
  assert.ok(html.includes('src="js/drag.js"'), 'index.html must load js/drag.js');
});
