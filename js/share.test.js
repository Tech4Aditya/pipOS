const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const share = require('./share.js');

describe('Peer-to-Peer QR Code Share Sheet for Songs & Wishes (pip-share)', () => {
  test('encodeSharePayload and decodeSharePayload roundtrip data accurately', () => {
    const encoded = share.encodeSharePayload('wish', 'Bedtime Wish', 'May stars watch over you tonight.');
    assert.ok(typeof encoded === 'string' && encoded.length > 10);

    const decoded = share.decodeSharePayload(encoded);
    assert.strictEqual(decoded.type, 'wish');
    assert.strictEqual(decoded.title, 'Bedtime Wish');
    assert.strictEqual(decoded.data, 'May stars watch over you tonight.');
    assert.strictEqual(decoded.version, 1);
  });

  test('decodeSharePayload handles full hash URL string', () => {
    const encoded = share.encodeSharePayload('melody', 'Lullaby Song', 'C4 E4 G4 A4');
    const hashUrl = 'https://pipos.org/#share=' + encoded;

    const decoded = share.decodeSharePayload(hashUrl);
    assert.strictEqual(decoded.type, 'melody');
    assert.strictEqual(decoded.title, 'Lullaby Song');
    assert.strictEqual(decoded.data, 'C4 E4 G4 A4');
  });

  test('generateQrMatrix creates standard 21x21 matrix with valid finder corners', () => {
    const matrix = share.generateQrMatrix('https://pipos.org');
    assert.strictEqual(matrix.length, 21);
    assert.strictEqual(matrix[0].length, 21);

    // Top-left finder pattern core
    assert.strictEqual(matrix[0][0], 1);
    assert.strictEqual(matrix[6][6], 1);
    assert.strictEqual(matrix[1][1], 0);

    // Top-right finder pattern
    assert.strictEqual(matrix[0][20], 1);
    assert.strictEqual(matrix[6][14], 1);

    // Bottom-left finder pattern
    assert.strictEqual(matrix[20][0], 1);
    assert.strictEqual(matrix[14][6], 1);
  });

  test('generateQrSvg produces valid SVG markup containing viewBox and rect tags', () => {
    const svg = share.generateQrSvg('PipOS Bedtime Lore');
    assert.ok(svg.includes('<svg xmlns="http://www.w3.org/2000/svg"'));
    assert.ok(svg.includes('viewBox="0 0 '));
    assert.ok(svg.includes('</svg>'));
  });

  test('generateQrSvg escapes user text and rejects unsafe colors', () => {
    const svg = share.generateQrSvg('<img src=x onerror=alert(1)>', {
      darkColor: '" onload="alert(1)',
      lightColor: '#fff'
    });
    assert.ok(svg.includes('&lt;img src=x onerror=alert(1)&gt;'));
    assert.ok(!svg.includes('onload="alert(1)'));
    assert.ok(svg.includes('fill="#0f172a"'));
  });

  test('index.html contains #shareWin window, QR container, copy button, and script tag', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('id="shareWin"'), 'index.html must include #shareWin window');
    assert.ok(html.includes('id="shareQrContainer"'), 'index.html must include #shareQrContainer');
    assert.ok(html.includes('id="shareTypeSelect"'), 'index.html must include #shareTypeSelect');
    assert.ok(html.includes('id="shareInput"'), 'index.html must include #shareInput');
    assert.ok(html.includes('id="shareGenerateBtn"'), 'index.html must include #shareGenerateBtn');
    assert.ok(html.includes('id="shareCopyLinkBtn"'), 'index.html must include #shareCopyLinkBtn');
    assert.ok(html.includes('src="js/share.js"'), 'index.html must include js/share.js script tag');
  });
});
