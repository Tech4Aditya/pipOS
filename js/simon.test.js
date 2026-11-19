import { test, describe } from 'node:test';
import assert from 'node:assert';
import Simon from './simon.js';

describe('PipOS Simon-Says Music Sequence Memory Puzzle (pip-simon.exe)', () => {
  test('TONES catalog has 4 distinct musical frequencies', () => {
    assert.strictEqual(Simon.TONES.length, 4);
    assert.strictEqual(Simon.TONES[0].color, 'green');
    assert.strictEqual(Simon.TONES[1].color, 'red');
    assert.strictEqual(Simon.TONES[2].color, 'yellow');
    assert.strictEqual(Simon.TONES[3].color, 'blue');
    assert.ok(Simon.TONES[0].freq < Simon.TONES[3].freq);
  });

  test('createInitialState creates clean unstarted state', () => {
    const state = Simon.createInitialState();
    assert.strictEqual(state.sequence.length, 0);
    assert.strictEqual(state.round, 0);
    assert.strictEqual(state.userStep, 0);
    assert.strictEqual(state.gameOver, false);
  });

  test('addStep adds random tone and resets user step', () => {
    const state = Simon.createInitialState();
    Simon.addStep(state);
    assert.strictEqual(state.sequence.length, 1);
    assert.strictEqual(state.round, 1);
    assert.strictEqual(state.userStep, 0);
    assert.ok(state.sequence[0] >= 0 && state.sequence[0] <= 3);
  });

  test('checkInput handles correct sequence progression', () => {
    const state = Simon.createInitialState();
    state.sequence = [0, 2];
    state.round = 2;

    const res1 = Simon.checkInput(state, 0);
    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.finishedRound, false);
    assert.strictEqual(res1.gameOver, false);

    const res2 = Simon.checkInput(state, 2);
    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.finishedRound, true);
    assert.strictEqual(res2.gameOver, false);
  });

  test('checkInput triggers gameOver on wrong sequence note', () => {
    const state = Simon.createInitialState();
    state.sequence = [1, 3];
    const res = Simon.checkInput(state, 0); // Expected 1, passed 0
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.gameOver, true);
    assert.strictEqual(state.gameOver, true);
  });

  test('saveHighScore preserves maximum streak', () => {
    const mockStorage = {
      store: {},
      getItem(k) { return this.store[k] || null; },
      setItem(k, v) { this.store[k] = String(v); }
    };

    assert.strictEqual(Simon.getHighScore(mockStorage), 0);
    Simon.saveHighScore(4, mockStorage);
    assert.strictEqual(Simon.getHighScore(mockStorage), 4);
    Simon.saveHighScore(2, mockStorage);
    assert.strictEqual(Simon.getHighScore(mockStorage), 4);
    Simon.saveHighScore(7, mockStorage);
    assert.strictEqual(Simon.getHighScore(mockStorage), 7);
  });
});
