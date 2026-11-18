'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');

const audio = require('./audio.js');

describe('Global Synthesizer Master Bus & Brickwall Limiter', () => {
  test('makeImpulse generates stereo decay buffer with correct length and sample rate', () => {
    const mockCtx = {
      sampleRate: 44100,
      createBuffer: (channels, length, sampleRate) => {
        const buffers = [new Float32Array(length), new Float32Array(length)];
        return {
          numberOfChannels: channels,
          length: length,
          sampleRate: sampleRate,
          getChannelData: (ch) => buffers[ch]
        };
      }
    };

    const buf = audio.makeImpulse(mockCtx, 1.5, 2.5);
    assert.strictEqual(buf.numberOfChannels, 2);
    assert.strictEqual(buf.length, Math.floor(44100 * 1.5));
    assert.strictEqual(buf.sampleRate, 44100);

    const left = buf.getChannelData(0);
    assert.ok(left.length > 0);
    // Initial samples should have higher amplitude than tail samples
    let sumHead = 0, sumTail = 0;
    const windowSize = 500;
    for (let i = 0; i < windowSize; i++) {
      sumHead += Math.abs(left[i]);
      sumTail += Math.abs(left[left.length - 1 - i]);
    }
    assert.ok(sumHead > sumTail, 'Reverb head should have higher energy than decaying tail');
  });

  test('setReverbWet clamps values between 0.0 and 1.0', () => {
    audio.setReverbWet(0.5);
    assert.strictEqual(audio.getReverbWet(), 0.5);

    audio.setReverbWet(-0.8);
    assert.strictEqual(audio.getReverbWet(), 0.0);

    audio.setReverbWet(2.4);
    assert.strictEqual(audio.getReverbWet(), 1.0);

    // Reset to default
    audio.setReverbWet(0.28);
  });

  test('SCALE array has 8 harmonious pentatonic notes in strictly increasing order', () => {
    assert.strictEqual(audio.SCALE.length, 8);
    for (let i = 1; i < audio.SCALE.length; i++) {
      assert.ok(audio.SCALE[i] > audio.SCALE[i - 1], `Note ${i} (${audio.SCALE[i]}) must be higher pitch than note ${i - 1} (${audio.SCALE[i - 1]})`);
    }
  });

  test('BASS scale notes are defined and within deep frequency range (100-300Hz)', () => {
    assert.ok(Array.isArray(audio.BASS));
    assert.ok(audio.BASS.length >= 4);
    audio.BASS.forEach((f) => {
      assert.ok(f >= 100 && f <= 300, `Bass note ${f}Hz must be within soothing range`);
    });
  });
});
