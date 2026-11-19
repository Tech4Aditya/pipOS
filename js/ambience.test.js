import { test, describe } from 'node:test';
import assert from 'node:assert';
import Ambience from './ambience.js';

describe('PipOS Procedural Ambience Generator (Ocean, Rain & Thunder)', () => {
  test('clamp restricts values to [0, 1] range', () => {
    assert.strictEqual(Ambience.clamp(0.5), 0.5);
    assert.strictEqual(Ambience.clamp(-0.2), 0);
    assert.strictEqual(Ambience.clamp(1.5), 1);
    assert.strictEqual(Ambience.clamp('0.8'), 0.8);
    assert.strictEqual(Ambience.clamp('invalid'), 0);
  });

  test('createAmbienceState returns initial default audio state', () => {
    const state = Ambience.createAmbienceState();
    assert.strictEqual(state.rainVolume, 0.5);
    assert.strictEqual(state.oceanVolume, 0.5);
    assert.strictEqual(state.thunderVolume, 0.5);
    assert.strictEqual(state.isRainPlaying, false);
    assert.strictEqual(state.isOceanPlaying, false);
  });

  test('startRain and stopRain execute safely without throws in headless environments', () => {
    assert.doesNotThrow(() => {
      Ambience.startRain(0.6);
      Ambience.stopRain();
    });
  });

  test('startOcean and stopOcean execute safely without throws in headless environments', () => {
    assert.doesNotThrow(() => {
      Ambience.startOcean(0.4);
      Ambience.stopOcean();
    });
  });

  test('triggerThunder executes safely without throws in headless environments', () => {
    assert.doesNotThrow(() => {
      Ambience.triggerThunder(0.7);
    });
  });
});
