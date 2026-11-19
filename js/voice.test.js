const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const voice = require('./voice.js');

describe('Bedtime Storybook Voice Narrator (pip-voice.exe)', () => {
  beforeEach(() => {
    voice.stop();
    voice.setPitch(1.0);
    voice.setRate(0.9);
    voice.setVolume(1.0);
  });

  test('BEDTIME_SCENES contains 6 illustrated bedtime story episodes', () => {
    assert.strictEqual(voice.BEDTIME_SCENES.length, 6);
    voice.BEDTIME_SCENES.forEach((sc, i) => {
      assert.ok(sc.title, `Scene ${i + 1} must have a title`);
      assert.ok(sc.text && sc.text.length > 20, `Scene ${i + 1} must have narrative text`);
    });
  });

  test('getScene retrieves scenes 1 through 6 and rejects out of bounds', () => {
    const sc1 = voice.getScene(1);
    assert.strictEqual(sc1.title, 'The Midnight Basket');

    const sc6 = voice.getScene(6);
    assert.strictEqual(sc6.title, 'Goodnight, Little Dreamer');

    assert.strictEqual(voice.getScene(0), null);
    assert.strictEqual(voice.getScene(7), null);
  });

  test('setPitch clamps pitch values between 0.5 and 2.0', () => {
    assert.strictEqual(voice.setPitch(1.5), true);
    assert.strictEqual(voice.getState().pitch, 1.5);

    voice.setPitch(5.0);
    assert.strictEqual(voice.getState().pitch, 2.0);

    voice.setPitch(0.1);
    assert.strictEqual(voice.getState().pitch, 0.5);

    assert.strictEqual(voice.setPitch('not-a-number'), false);
  });

  test('setRate clamps speech rate values between 0.5 and 1.5', () => {
    assert.strictEqual(voice.setRate(1.2), true);
    assert.strictEqual(voice.getState().rate, 1.2);

    voice.setRate(3.0);
    assert.strictEqual(voice.getState().rate, 1.5);

    voice.setRate(0.2);
    assert.strictEqual(voice.getState().rate, 0.5);
  });

  test('setVolume clamps volume values between 0.0 and 1.0', () => {
    assert.strictEqual(voice.setVolume(0.8), true);
    assert.strictEqual(voice.getState().volume, 0.8);

    voice.setVolume(2.5);
    assert.strictEqual(voice.getState().volume, 1.0);

    voice.setVolume(-0.5);
    assert.strictEqual(voice.getState().volume, 0.0);
  });

  test('state transitions safely when speaking and stopping', () => {
    voice.speak('Pip is falling asleep under the starlight.');
    assert.strictEqual(voice.getState().status, 'speaking');

    voice.stop();
    assert.strictEqual(voice.getState().status, 'idle');
  });

  test('index.html contains #voice window with textarea, controls, sliders, and script tag', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('id="voice"'), 'index.html must include #voice window');
    assert.ok(html.includes('id="voiceTitle"'), 'index.html must include #voiceTitle');
    assert.ok(html.includes('id="voiceTextInput"'), 'index.html must include text input');
    assert.ok(html.includes('id="voiceSelect"'), 'index.html must include voice select');
    assert.ok(html.includes('id="voicePitchSlider"'), 'index.html must include pitch slider');
    assert.ok(html.includes('id="voiceRateSlider"'), 'index.html must include rate slider');
    assert.ok(html.includes('id="voicePlayBtn"'), 'index.html must include play button');
    assert.ok(html.includes('id="voicePauseBtn"'), 'index.html must include pause button');
    assert.ok(html.includes('id="voiceStopBtn"'), 'index.html must include stop button');
    assert.ok(html.includes('data-scene="1"'), 'index.html must include Scene 1 button');
    assert.ok(html.includes('src="js/voice.js"'), 'index.html must include js/voice.js script tag');
  });
});
