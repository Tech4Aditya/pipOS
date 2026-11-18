const test = require('node:test');
const assert = require('node:assert/strict');
const { encodeTune, decodeTune, MAX_NOTES } = require('./recorder.js');

test('Music Box Recorder: serialization and validation', async (t) => {
  await t.test('encodes and decodes a simple tune roundtrip', () => {
    const original = [
      { note: 0, delay: 200 },
      { note: 2, delay: 350 },
      { note: 4, delay: 180 },
      { note: 7, delay: 500 }
    ];

    const encoded = encodeTune(original);
    assert.ok(encoded.startsWith('v1~'), 'Encoded tune must start with v1~');
    
    const decoded = decodeTune(encoded);
    assert.deepStrictEqual(decoded, original);
  });

  await t.test('handles hash prefixes (#tune= or tune=) in decodeTune', () => {
    const raw = '#tune=v1~1_200~3_400';
    const decoded = decodeTune(raw);
    assert.deepStrictEqual(decoded, [
      { note: 1, delay: 200 },
      { note: 3, delay: 400 }
    ]);
  });

  await t.test('enforces MAX_NOTES limit', () => {
    const manyNotes = [];
    for (let i = 0; i < 200; i++) {
      manyNotes.push({ note: i % 8, delay: 100 });
    }

    const encoded = encodeTune(manyNotes);
    const decoded = decodeTune(encoded);
    assert.strictEqual(decoded.length, MAX_NOTES, 'Must cap decoded sequence at MAX_NOTES (128)');
  });

  await t.test('rejects malicious payloads or script injection attempts', () => {
    const malicious = [
      '<script>alert(1)</script>',
      'javascript:void(0)',
      'v1~0_200;drop table wishes',
      'v1~0_200~<img src=x onerror=alert(1)>',
      'v1~8_200~-1_200', // out of bounds notes
      '',
      null,
      undefined
    ];

    malicious.forEach((bad) => {
      const result = decodeTune(bad);
      if (typeof bad === 'string' && bad.includes('8_200')) {
        assert.deepStrictEqual(result, [], 'Must reject out of range note numbers');
      } else {
        assert.ok(Array.isArray(result), 'Result should be an array');
        assert.strictEqual(result.length === 0, true, 'Malicious string must return empty array');
      }
    });
  });

  await t.test('clamps delays between 40ms and 4000ms', () => {
    const input = [
      { note: 0, delay: 5 },       // too short
      { note: 1, delay: 9999999 }  // too long
    ];
    const encoded = encodeTune(input);
    const decoded = decodeTune(encoded);

    assert.strictEqual(decoded[0].delay, 40, 'Delay must be clamped to minimum 40ms');
    assert.strictEqual(decoded[1].delay, 4000, 'Delay must be clamped to maximum 4000ms');
  });
});

test('Music Box Recorder: index.html DOM contract', () => {
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  assert.ok(html.includes('id="labRecorder"'), 'index.html must include #labRecorder');
  assert.ok(html.includes('id="recBtn"'), 'index.html must include #recBtn');
  assert.ok(html.includes('id="recPlayBtn"'), 'index.html must include #recPlayBtn');
  assert.ok(html.includes('id="recShareBtn"'), 'index.html must include #recShareBtn');
  assert.ok(html.includes('id="tunePrompt"'), 'index.html must include #tunePrompt');
  assert.ok(html.includes('src="js/recorder.js"'), 'index.html must include js/recorder.js');
});
