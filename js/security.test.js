'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Security = require('./security.js');

test('Security: safeJsonParse parses valid JSON normally', () => {
  const result = Security.safeJsonParse('{"score": 100, "user": "Pip"}', null);
  assert.deepStrictEqual(result, { score: 100, user: 'Pip' });
});

test('Security: safeJsonParse drops __proto__ and constructor prototype injection', () => {
  const maliciousPayload = '{"__proto__": {"polluted": true}, "constructor": {"prototype": {"isAdmin": true}}, "normal": "valid"}';
  const result = Security.safeJsonParse(maliciousPayload, null);

  assert.strictEqual(result.normal, 'valid');
  assert.strictEqual(result.__proto__.polluted, undefined);
  assert.strictEqual(({}).polluted, undefined, 'Object.prototype must not be polluted');
  assert.strictEqual(({}).isAdmin, undefined, 'Object.prototype must not have isAdmin');
});

test('Security: safeJsonParse returns fallback on invalid JSON syntax', () => {
  const fallback = { fallback: true };
  const result = Security.safeJsonParse('not a valid json string', fallback);
  assert.strictEqual(result, fallback);
});

test('Security: deepFreeze recursively makes object immutable', () => {
  const config = {
    theme: 'night',
    scales: {
      pentatonic: [523, 659, 784]
    }
  };

  Security.deepFreeze(config);
  assert.strictEqual(Object.isFrozen(config), true);
  assert.strictEqual(Object.isFrozen(config.scales), true);

  // Attempting mutation in strict mode or non-strict fails
  assert.throws(() => {
    config.theme = 'day';
  }, /Cannot assign to read only property/);

  assert.throws(() => {
    config.scales.pentatonic.push(999);
  }, /Cannot add property/);
});

test('Security: sanitizeHtml escapes HTML entities preventing injection', () => {
  const payload = '<script>alert("xss")</script>&<img src=x onerror=alert(1)>';
  const sanitized = Security.sanitizeHtml(payload);
  assert.strictEqual(sanitized.includes('<script>'), false);
  assert.strictEqual(sanitized.includes('&lt;script&gt;'), true);
  assert.strictEqual(sanitized.includes('&amp;'), true);
  assert.strictEqual(sanitized.includes('&quot;'), true);
});

test('Security: isSafeUrl validates safe schemes and blocks dangerous protocols', () => {
  assert.strictEqual(Security.isSafeUrl('https://tech4aditya.github.io/pipOS/'), true);
  assert.strictEqual(Security.isSafeUrl('#work'), true);
  assert.strictEqual(Security.isSafeUrl('/assets/icon-192.png'), true);
  assert.strictEqual(Security.isSafeUrl('mailto:pip@nursery.local'), true);

  // Dangerous attack protocols
  assert.strictEqual(Security.isSafeUrl('javascript:alert(1)'), false);
  assert.strictEqual(Security.isSafeUrl('javascript://%0aalert(1)'), false);
  assert.strictEqual(Security.isSafeUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.strictEqual(Security.isSafeUrl('vbscript:msgbox(1)'), false);
});
