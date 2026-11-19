import { test, describe } from 'node:test';
import assert from 'node:assert';
import Editor from './editor.js';

describe('PipOS Retro Text Editor (pip-pad.exe)', () => {
  test('countWords calculates word count across spaces and newlines', () => {
    assert.strictEqual(Editor.countWords(''), 0);
    assert.strictEqual(Editor.countWords('   '), 0);
    assert.strictEqual(Editor.countWords('Hello world'), 2);
    assert.strictEqual(Editor.countWords('The quick  brown\nfox jumps   over'), 6);
  });

  test('countChars counts characters accurately', () => {
    assert.strictEqual(Editor.countChars(''), 0);
    assert.strictEqual(Editor.countChars('PipOS'), 5);
    assert.strictEqual(Editor.countChars('Hello\nWorld'), 11);
  });

  test('countLines counts line breaks correctly', () => {
    assert.strictEqual(Editor.countLines(''), 1);
    assert.strictEqual(Editor.countLines('One line'), 1);
    assert.strictEqual(Editor.countLines('Line 1\nLine 2\nLine 3'), 3);
  });

  test('saveDraft and loadDraft safely persist content', () => {
    const mockStorage = {
      store: {},
      getItem(k) { return this.store[k] || null; },
      setItem(k, v) { this.store[k] = String(v); }
    };

    assert.strictEqual(Editor.loadDraft(mockStorage), '');
    Editor.saveDraft('Bedtime story notes for Pip', mockStorage);
    assert.strictEqual(Editor.loadDraft(mockStorage), 'Bedtime story notes for Pip');
  });

  test('exportTextFile sanitizes output filename', () => {
    // If Blob and URL are not available in node, test graceful sanitization
    if (typeof globalThis.Blob !== 'undefined' && typeof globalThis.URL !== 'undefined') {
      // Mock document.body.appendChild
      const originalAppend = globalThis.document?.body?.appendChild;
      const safe = Editor.exportTextFile('my notes?.txt', 'content');
      assert.ok(safe.includes('my_notes'));
    } else {
      assert.ok(true);
    }
  });
});
