const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const clock = require('./clock.js');

describe('Celestial Clock, Sleep Timer & Bedtime Pomodoro (pip-clock.exe)', () => {
  beforeEach(() => {
    clock.cancelSleepTimer();
    clock.cancelPomodoro();
  });

  test('formatTime generates valid 12h and 24h time strings', () => {
    const testDate = new Date(2026, 10, 18, 14, 5, 9); // 14:05:09 -> 02:05:09 PM

    const t12 = clock.formatTime(testDate, false);
    assert.strictEqual(t12, '02:05:09 PM');

    const t24 = clock.formatTime(testDate, true);
    assert.strictEqual(t24, '14:05:09');

    // Midnight check
    const midnight = new Date(2026, 10, 18, 0, 15, 0);
    assert.strictEqual(clock.formatTime(midnight, false), '12:15:00 AM');
    assert.strictEqual(clock.formatTime(midnight, true), '00:15:00');
  });

  test('formatSeconds converts numeric seconds to padded MM:SS format', () => {
    assert.strictEqual(clock.formatSeconds(0), '00:00');
    assert.strictEqual(clock.formatSeconds(65), '01:05');
    assert.strictEqual(clock.formatSeconds(1500), '25:00');
    assert.strictEqual(clock.formatSeconds(3600), '60:00');
  });

  test('getHandAngles calculates correct clock hand angles and day/night phase', () => {
    // 6:00:00 AM
    const morning = new Date(2026, 10, 18, 6, 0, 0);
    const mAngles = clock.getHandAngles(morning);
    assert.strictEqual(mAngles.hour, 180);
    assert.strictEqual(mAngles.minute, 0);
    assert.strictEqual(mAngles.second, 0);
    assert.strictEqual(mAngles.isNight, false);

    // 11:30:00 PM
    const night = new Date(2026, 10, 18, 23, 30, 0);
    const nAngles = clock.getHandAngles(night);
    assert.strictEqual(nAngles.isNight, true);
    assert.ok(nAngles.minute >= 180);
  });

  test('startSleepTimer and cancelSleepTimer manage countdown lifecycle', () => {
    assert.strictEqual(clock.startSleepTimer(30), true);
    const state = clock.getState();
    assert.strictEqual(state.sleepTimerActive, true);
    assert.strictEqual(state.sleepTimerSeconds, 1800);

    clock.cancelSleepTimer();
    const cancelled = clock.getState();
    assert.strictEqual(cancelled.sleepTimerActive, false);
    assert.strictEqual(cancelled.sleepTimerSeconds, 0);

    // Rejects invalid minutes
    assert.strictEqual(clock.startSleepTimer(-5), false);
  });

  test('startPomodoro and cancelPomodoro transition modes correctly', () => {
    clock.startPomodoro();
    assert.strictEqual(clock.getState().pomoMode, 'focus');
    assert.strictEqual(clock.getState().pomoSeconds, 1500);

    clock.cancelPomodoro();
    assert.strictEqual(clock.getState().pomoMode, 'idle');
    assert.strictEqual(clock.getState().pomoSeconds, 0);
  });

  test('index.html contains #clock window with SVG analog face, digital LED, sleep timer, and script tag', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('id="clockWin"'), 'index.html must include #clockWin window');
    assert.ok(html.includes('id="clockTitle"'), 'index.html must include #clockTitle');
    assert.ok(html.includes('id="clockDigital"'), 'index.html must include digital time display');
    assert.ok(html.includes('id="clockHandHour"'), 'index.html must include hour hand in SVG');
    assert.ok(html.includes('id="clockHandMinute"'), 'index.html must include minute hand in SVG');
    assert.ok(html.includes('id="clockHandSecond"'), 'index.html must include second hand in SVG');
    assert.ok(html.includes('id="clockSleepSelect"'), 'index.html must include sleep timer selector');
    assert.ok(html.includes('id="clockSleepStartBtn"'), 'index.html must include sleep start button');
    assert.ok(html.includes('id="clockPomoStartBtn"'), 'index.html must include pomodoro start button');
    assert.ok(html.includes('src="js/clock.js"'), 'index.html must include js/clock.js script tag');
  });
});
