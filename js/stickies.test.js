const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const stickies = require('./stickies.js');

describe('Desktop Sticky Notes & Multi-Clipboard History (pip-stickies.exe)', () => {
  beforeEach(() => {
    stickies.load();
  });

  test('createNote adds a new sticky note with color and timestamp', () => {
    const note = stickies.createNote('Grocery List', 'Milk, Honey, Stars', 'mint', true);
    assert.strictEqual(note.title, 'Grocery List');
    assert.strictEqual(note.content, 'Milk, Honey, Stars');
    assert.strictEqual(note.color, 'mint');
    assert.strictEqual(note.pinned, true);
    assert.ok(typeof note.id === 'string' && note.id.startsWith('sticky_'));
  });

  test('updateNote patches existing note title, body, pinned state and color', () => {
    const note = stickies.createNote('Original', 'Body', 'lemon', false);
    const updated = stickies.updateNote(note.id, {
      title: 'Patched Title',
      content: 'Updated Body',
      color: 'rose',
      pinned: true
    });

    assert.strictEqual(updated.title, 'Patched Title');
    assert.strictEqual(updated.content, 'Updated Body');
    assert.strictEqual(updated.color, 'rose');
    assert.strictEqual(updated.pinned, true);
  });

  test('deleteNote removes note by id', () => {
    const note = stickies.createNote('To Be Deleted', 'Bye', 'sky', false);
    const success = stickies.deleteNote(note.id);
    assert.strictEqual(success, true);

    const notes = stickies.getNotes();
    assert.ok(!notes.some(n => n.id === note.id));
  });

  test('getNotes filters notes by search query and prioritizes pinned notes', () => {
    const unpinned = stickies.createNote('Searchable Alpha', 'alpha body text', 'lemon', false);
    const pinned = stickies.createNote('Searchable Beta', 'beta body text', 'sky', true);

    const results = stickies.getNotes('Searchable');
    assert.ok(results.length >= 2);
    // Pinned note should appear before unpinned note
    const betaIdx = results.findIndex(n => n.id === pinned.id);
    const alphaIdx = results.findIndex(n => n.id === unpinned.id);
    assert.ok(betaIdx < alphaIdx);
  });

  test('pushClipboard maintains ring buffer without duplicates and limits to max history', () => {
    stickies.clearClipboard();
    stickies.pushClipboard('First snippet');
    stickies.pushClipboard('Second snippet');
    stickies.pushClipboard('First snippet'); // Moves First snippet back to front

    const history = stickies.getClipboardHistory();
    assert.strictEqual(history[0], 'First snippet');
    assert.strictEqual(history[1], 'Second snippet');
    assert.strictEqual(history.length, 2);
  });

  test('index.html contains #stickiesWin window with note list, clipboard list, and script tag', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('id="stickiesWin"'), 'index.html must include #stickiesWin window');
    assert.ok(html.includes('id="stickiesList"'), 'index.html must include #stickiesList');
    assert.ok(html.includes('id="stickiesClipList"'), 'index.html must include #stickiesClipList');
    assert.ok(html.includes('id="stickiesAddBtn"'), 'index.html must include #stickiesAddBtn');
    assert.ok(html.includes('id="stickiesSearch"'), 'index.html must include #stickiesSearch');
    assert.ok(html.includes('src="js/stickies.js"'), 'index.html must include js/stickies.js script tag');
  });
});
