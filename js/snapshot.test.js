const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const TOYS_JS_PATH = path.join(ROOT_DIR, 'js', 'toys.js');
const TERM_JS_PATH = path.join(ROOT_DIR, 'js', 'terminal.js');

test('PIP.toys exports downloadCanvas helper', () => {
  const toys = require(TOYS_JS_PATH);
  assert.strictEqual(typeof toys.downloadCanvas, 'function', 'downloadCanvas must be exported as a function');
  assert.strictEqual(toys.downloadCanvas(null), false, 'Calling downloadCanvas with null returns false');
});

test('downloadCanvas generates PNG blob and triggers download via temporary link', (t, done) => {
  const toys = require(TOYS_JS_PATH);

  let clicked = false;
  let downloadedFileName = '';
  let hrefValue = '';
  let linkAppended = false;
  let linkRemoved = false;
  let revokedUrl = '';

  const mockBlob = { size: 1234, type: 'image/png' };
  const mockUrl = 'blob:http://localhost/mock-blob-uuid';

  global.URL = {
    createObjectURL(blob) {
      assert.strictEqual(blob, mockBlob);
      return mockUrl;
    },
    revokeObjectURL(url) {
      revokedUrl = url;
    }
  };

  const mockLink = {
    style: {},
    setAttribute(attr, val) {
      if (attr === 'download') downloadedFileName = val;
    },
    click() {
      clicked = true;
    },
    parentNode: null
  };

  const mockDoc = {
    createElement(tag) {
      assert.strictEqual(tag, 'a');
      return mockLink;
    },
    body: {
      appendChild(child) {
        linkAppended = true;
        child.parentNode = this;
      },
      removeChild(child) {
        linkRemoved = true;
        child.parentNode = null;
      }
    }
  };

  const mockCanvas = {
    ownerDocument: mockDoc,
    toBlob(callback, type) {
      assert.strictEqual(type, 'image/png');
      callback(mockBlob);
    }
  };

  const res = toys.downloadCanvas(mockCanvas, 'tower-snapshot');
  assert.strictEqual(res, true, 'downloadCanvas returns true when initiated');
  assert.strictEqual(clicked, true, 'Temporary link was clicked');
  assert.strictEqual(mockLink.download, 'tower-snapshot.png', 'Extension .png was appended');
  assert.strictEqual(mockLink.href, mockUrl, 'Blob URL was assigned to link href');
  assert.strictEqual(linkAppended, true, 'Link was appended to body');

  setTimeout(() => {
    assert.strictEqual(linkRemoved, true, 'Link was cleaned up');
    assert.strictEqual(revokedUrl, mockUrl, 'Blob URL was revoked');
    done();
  }, 200);
});

test('downloadCanvas falls back to toDataURL when toBlob is not available', () => {
  const toys = require(TOYS_JS_PATH);

  let clicked = false;
  const mockDataUrl = 'data:image/png;base64,mockpngdata';

  const mockLink = {
    style: {},
    setAttribute() {},
    click() { clicked = true; }
  };

  const mockDoc = {
    createElement() { return mockLink; },
    body: {
      appendChild() {},
      removeChild() {}
    }
  };

  const mockCanvas = {
    ownerDocument: mockDoc,
    toDataURL(type) {
      assert.strictEqual(type, 'image/png');
      return mockDataUrl;
    }
  };

  const res = toys.downloadCanvas(mockCanvas, 'custom.png');
  assert.strictEqual(res, true);
  assert.strictEqual(clicked, true);
  assert.strictEqual(mockLink.download, 'custom.png');
  assert.strictEqual(mockLink.href, mockDataUrl);
});

test('terminal blocks command triggers canvas snapshot and autocompletes', () => {
  const term = require(TERM_JS_PATH);
  const toys = require(TOYS_JS_PATH);

  // Check COMMANDS and PARAM_HINTS
  assert.ok(term.COMMANDS.includes('blocks'), 'blocks command must be registered');
  assert.ok(term.PARAM_HINTS.blocks, 'PARAM_HINTS must include blocks');
  assert.deepStrictEqual(term.PARAM_HINTS.blocks.params, ['snapshot']);

  // Autocomplete tests
  const bloMatches = term.autocomplete('blo');
  assert.ok(bloMatches.includes('blocks'), 'blo autocompletes to blocks');

  const blocksSubMatches = term.autocomplete('blocks ');
  assert.deepStrictEqual(blocksSubMatches, ['blocks snapshot'], 'blocks space autocompletes to blocks snapshot');

  // Command execution: usage when no subcommand
  const usageRes = term.executeCommand('blocks');
  assert.match(usageRes.output, /Usage: blocks snapshot/i);

  // Command execution with mock canvas
  let downloadedCanvas = null;
  let downloadedFileName = '';

  const mockCanvas = { id: 'blockCanvas' };
  const mockDoc = {
    getElementById(id) {
      if (id === 'blockCanvas') return mockCanvas;
      return null;
    }
  };

  global.document = mockDoc;
  global.PIP = global.PIP || {};
  global.PIP.toys = {
    downloadCanvas(canvas, filename) {
      downloadedCanvas = canvas;
      downloadedFileName = filename;
      return true;
    }
  };

  try {
    const snapRes = term.executeCommand('blocks snapshot');
    assert.ok(snapRes.ok);
    assert.match(snapRes.output, /Stacking tower snapshot captured/i);
    assert.strictEqual(downloadedCanvas, mockCanvas);
    assert.strictEqual(downloadedFileName, 'pip-blocks-snapshot.png');
  } finally {
    delete global.PIP.toys;
    delete global.document;
  }
});
