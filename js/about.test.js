const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const about = require('./about.js');

describe('About PipOS System Info & GPU Benchmark (pip-about.exe)', () => {
  test('getSysInfo returns comprehensive system diagnostics', () => {
    const info = about.getSysInfo();
    assert.strictEqual(info.osName, 'pipOS 1.0 (Starlight Edition)');
    assert.strictEqual(info.kernel, 'Vanilla Web Engine (Zero-Runtime)');
    assert.ok(info.screenRes);
    assert.ok(info.gpu);
    assert.ok(info.memory);
  });

  test('getBenchmarkRating tiers FPS performance accurately', () => {
    const blazing = about.getBenchmarkRating(60);
    assert.strictEqual(blazing.grade, 'Blazing');
    assert.strictEqual(blazing.stars, '★★★');

    const swift = about.getBenchmarkRating(48);
    assert.strictEqual(swift.grade, 'Swift');
    assert.strictEqual(swift.stars, '★★☆');

    const cozy = about.getBenchmarkRating(30);
    assert.strictEqual(cozy.grade, 'Cozy');
    assert.strictEqual(cozy.stars, '★☆☆');
  });

  test('getDiagnosticsReport formats markdown diagnostics report correctly', () => {
    const report = about.getDiagnosticsReport();
    assert.ok(report.includes('### PipOS System Diagnostics Report'));
    assert.ok(report.includes('- **OS:** pipOS 1.0 (Starlight Edition)'));
    assert.ok(report.includes('- **GPU:**'));
  });

  test('index.html contains #about window with diagnostics fields, canvas benchmark, and script tag', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('id="sysInfo"'), 'index.html must include #sysInfo window');
    assert.ok(html.includes('id="sysInfoTitle"'), 'index.html must include #sysInfoTitle');
    assert.ok(html.includes('id="aboutOsName"'), 'index.html must include #aboutOsName');
    assert.ok(html.includes('id="aboutGpu"'), 'index.html must include #aboutGpu');
    assert.ok(html.includes('id="aboutMemory"'), 'index.html must include #aboutMemory');
    assert.ok(html.includes('id="aboutCopyBtn"'), 'index.html must include #aboutCopyBtn');
    assert.ok(html.includes('id="benchCanvas"'), 'index.html must include #benchCanvas');
    assert.ok(html.includes('id="aboutStartBenchBtn"'), 'index.html must include #aboutStartBenchBtn');
    assert.ok(html.includes('src="js/about.js"'), 'index.html must include js/about.js script tag');
  });
});
