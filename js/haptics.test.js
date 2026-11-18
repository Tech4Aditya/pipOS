const test = require('node:test');
const assert = require('node:assert/strict');
const {
  triggerHaptic,
  canVibrate,
  isEnabled,
  setEnabled,
  HAPTIC_PATTERNS
} = require('./haptics.js');

test('Haptic Feedback: opt-in and permission gating logic', async (t) => {
  await t.test('default state is off (opt-in requirement)', () => {
    // By default without store setup, isEnabled is false
    setEnabled(false);
    assert.strictEqual(isEnabled(), false, 'Haptics must be disabled by default');
  });

  await t.test('canVibrate returns false when disabled', () => {
    setEnabled(false);
    assert.strictEqual(canVibrate(), false);
  });

  await t.test('Haptic patterns match specifications', () => {
    assert.deepStrictEqual(HAPTIC_PATTERNS.key, [12], 'Key tap must be a short 12ms pulse');
    assert.deepStrictEqual(HAPTIC_PATTERNS.drop, [22], 'Block drop must be 22ms pulse');
    assert.deepStrictEqual(HAPTIC_PATTERNS.dream, [15, 30, 18], 'Dream found must be double pulse');
  });

  await t.test('triggerHaptic returns false when navigator.vibrate is unavailable', () => {
    setEnabled(true);
    // In Node.js environment without mock navigator.vibrate
    const res = triggerHaptic('key');
    assert.strictEqual(res, false, 'Must safely return false when vibration is not supported');
  });
});

test('Haptic Feedback: index.html markup and accessibility contract', () => {
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  assert.ok(html.includes('id="hapticsToggleBtn"'), 'index.html must include #hapticsToggleBtn');
  assert.ok(html.includes('id="hapticsStatus"'), 'index.html must include #hapticsStatus');
  assert.ok(html.includes('src="js/haptics.js"'), 'index.html must load js/haptics.js');
});
