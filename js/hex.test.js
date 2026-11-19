const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const hex = require('./hex.js');

describe('Retro Hex Byte Inspector & Save Vault Viewer (pip-hex.exe)', () => {
  test('toHexDump generates standard 16-byte offset rows with hex bytes and ascii decoding', () => {
    const dump = hex.toHexDump('Hello World! 1234');
    assert.strictEqual(dump.byteLength, 17);
    assert.ok(dump.lines.length >= 2);

    const firstLine = dump.lines[0];
    assert.strictEqual(firstLine.offset, '00000000');
    // First 8 bytes: 'Hello Wo' -> 48 65 6C 6C 6F 20 57 6F
    assert.ok(firstLine.hex1.includes('48 65 6C'));
    assert.ok(firstLine.ascii.startsWith('Hello'));
  });

  test('computeCrc32 computes standard IEEE 802.3 CRC32 checksums', () => {
    const bytes = hex.stringToBytes('123456789');
    const crc = hex.computeCrc32(bytes);
    assert.strictEqual(crc, 0xcbf43926);
  });

  test('inspect handles text payloads and provides complete formatted dump', () => {
    const res = hex.inspect('text', 'custom', 'PipOS Starlight');
    assert.strictEqual(res.byteLength, 15);
    assert.ok(res.text.includes('00000000:'));
    assert.ok(res.text.includes('PipOS Starlight'));
  });

  test('index.html contains #hexWin window with screen, target selector, and script tag', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('id="hexWin"'), 'index.html must include #hexWin window');
    assert.ok(html.includes('id="hexTitle"'), 'index.html must include #hexTitle');
    assert.ok(html.includes('id="hexScreen"'), 'index.html must include #hexScreen output');
    assert.ok(html.includes('id="hexTargetSelect"'), 'index.html must include target select');
    assert.ok(html.includes('id="hexInput"'), 'index.html must include custom input');
    assert.ok(html.includes('id="hexInspectBtn"'), 'index.html must include inspect button');
    assert.ok(html.includes('src="js/hex.js"'), 'index.html must include js/hex.js script tag');
  });
});
