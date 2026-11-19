const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const bridge = require('./bridge.js');

describe('Host Drag-and-Drop File Import & Export Bridge (pip-drop-import)', () => {
  beforeEach(() => {
    bridge.load();
  });

  test('importFile ingests host file metadata and returns record', () => {
    const record = bridge.importFile('dream_notes.txt', 'Once upon a midnight star...', 'text/plain');
    assert.strictEqual(record.name, 'dream_notes.txt');
    assert.strictEqual(record.path, '/home/pip/imports/dream_notes.txt');
    assert.strictEqual(record.size, 28);
    assert.strictEqual(record.type, 'text/plain');

    const list = bridge.getImportedFiles();
    assert.ok(list.some(f => f.name === 'dream_notes.txt'));
  });

  test('removeImportedFile deletes file from import catalog', () => {
    bridge.importFile('to_remove.json', '{"status":"ok"}', 'application/json');
    const removed = bridge.removeImportedFile('to_remove.json');
    assert.strictEqual(removed, true);

    const list = bridge.getImportedFiles();
    assert.ok(!list.some(f => f.name === 'to_remove.json'));
  });

  test('exportArchive produces valid JSON representation of all imported files', () => {
    bridge.importFile('sample.md', '# Starlight Chapter', 'text/markdown');
    const archiveJson = bridge.exportArchive();
    const parsed = JSON.parse(archiveJson);

    assert.strictEqual(parsed.source, 'PipOS Host Bridge');
    assert.ok(Array.isArray(parsed.files));
    assert.ok(parsed.files.some(f => f.name === 'sample.md'));
  });

  test('index.html contains #bridgeWin window, #dropOverlay, file input, and script tag', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('id="bridgeWin"'), 'index.html must include #bridgeWin window');
    assert.ok(html.includes('id="bridgeList"'), 'index.html must include #bridgeList');
    assert.ok(html.includes('id="bridgeFileInput"'), 'index.html must include file input fallback');
    assert.ok(html.includes('id="bridgeExportAllBtn"'), 'index.html must include export button');
    assert.ok(html.includes('id="dropOverlay"'), 'index.html must include #dropOverlay');
    assert.ok(html.includes('src="js/bridge.js"'), 'index.html must include js/bridge.js script tag');
  });
});
