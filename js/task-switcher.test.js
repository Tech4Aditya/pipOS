'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Switcher = require('./task-switcher.js');

test('Switcher: cycleNext wraps around correctly', () => {
  assert.strictEqual(Switcher.cycleNext(5, 0), 1);
  assert.strictEqual(Switcher.cycleNext(5, 4), 0);
  assert.strictEqual(Switcher.cycleNext(1, 0), 0);
  assert.strictEqual(Switcher.cycleNext(0, 0), 0);
});

test('Switcher: cyclePrev wraps backwards correctly', () => {
  assert.strictEqual(Switcher.cyclePrev(5, 0), 4);
  assert.strictEqual(Switcher.cyclePrev(5, 3), 2);
  assert.strictEqual(Switcher.cyclePrev(1, 0), 0);
});

test('Switcher: modal visibility tracking', () => {
  assert.strictEqual(Switcher.isModalOpen(), false);
});
