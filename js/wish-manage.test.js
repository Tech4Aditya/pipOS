const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const fx = require('./fx.js');

const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT_DIR, 'index.html');
const CSS_PATH = path.join(ROOT_DIR, 'css', 'style.css');

/* =========================================================================
   Mock DOM Document for testing interactive elements and event handlers
   ========================================================================= */
function createInteractiveMockDocument() {
  function MockNode(tagName) {
    this.tagName = tagName ? tagName.toUpperCase() : 'DIV';
    this.children = [];
    this.parentNode = null;
    this.className = '';
    this.style = {
      display: '',
      setProperty: (k, v) => { this.style[k] = v; }
    };
    this.attributes = {};
    this.eventListeners = {};
    this._textContent = '';
    this.focused = false;
  }

  Object.defineProperty(MockNode.prototype, 'textContent', {
    get() {
      return this._textContent;
    },
    set(v) {
      this.children = [];
      this._textContent = String(v);
    }
  });

  MockNode.prototype.setAttribute = function (k, v) {
    this.attributes[k] = String(v);
  };

  MockNode.prototype.getAttribute = function (k) {
    return this.attributes[k] || null;
  };

  MockNode.prototype.appendChild = function (child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  };

  MockNode.prototype.removeChild = function (child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  };

  MockNode.prototype.querySelector = function (sel) {
    const isClass = sel.startsWith('.');
    const target = isClass ? sel.slice(1) : sel.toUpperCase();
    function search(node) {
      for (const child of node.children) {
        if (isClass && child.className.split(/\s+/).includes(target)) return child;
        if (!isClass && child.tagName === target) return child;
        const found = search(child);
        if (found) return found;
      }
      return null;
    }
    return search(this);
  };

  MockNode.prototype.querySelectorAll = function (sel) {
    const results = [];
    const isClass = sel.startsWith('.');
    const target = isClass ? sel.slice(1) : sel.toUpperCase();
    function search(node) {
      for (const child of node.children) {
        if (isClass && child.className.split(/\s+/).includes(target)) results.push(child);
        if (!isClass && child.tagName === target) results.push(child);
        search(child);
      }
    }
    search(this);
    return results;
  };

  MockNode.prototype.addEventListener = function (event, handler) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(handler);
  };

  MockNode.prototype.dispatchEvent = function (eventObj) {
    const type = typeof eventObj === 'string' ? eventObj : eventObj.type;
    const listeners = this.eventListeners[type] || [];
    const ev = typeof eventObj === 'string' ? { type: eventObj, stopPropagation: () => {} } : eventObj;
    if (!ev.stopPropagation) ev.stopPropagation = () => {};
    for (const fn of listeners) {
      fn.call(this, ev);
    }
  };

  MockNode.prototype.focus = function () {
    this.focused = true;
  };

  MockNode.prototype.click = function () {
    this.dispatchEvent({ type: 'click', stopPropagation: () => {} });
  };

  const body = new MockNode('BODY');
  return {
    body: body,
    createElement(tag) {
      return new MockNode(tag);
    }
  };
}

/* =========================================================================
   1. Plain Text Format & Export Tests
   ========================================================================= */
test('formatWishesText formats wishes array into clean, human-readable text', () => {
  const wishes = [
    { n: 'Sleepy Fox', w: 'Warm socks and blueberry pie', t: 1700000000000 },
    { n: 'Mrs. Hoot', w: 'Soft moonlight for all dreamers', t: 1700000050000 }
  ];

  const text = fx.formatWishesText(wishes);
  assert.ok(typeof text === 'string');
  assert.match(text, /Pip's Wish Wall — My Wishes/);
  assert.match(text, /1\. "Warm socks and blueberry pie"/);
  assert.match(text, /— Sleepy Fox/);
  assert.match(text, /2\. "Soft moonlight for all dreamers"/);
  assert.match(text, /— Mrs\. Hoot/);
  assert.match(text, /Exported from pipOS/);
});

test('formatWishesText handles empty wish lists gracefully', () => {
  const textEmpty = fx.formatWishesText([]);
  assert.match(textEmpty, /No wishes pinned yet/);

  const textNull = fx.formatWishesText(null);
  assert.match(textNull, /No wishes pinned yet/);
});

test('exportWishes returns exported text and creates download element', () => {
  const mockDoc = createInteractiveMockDocument();
  const wishes = [{ n: 'Dreamer', w: 'Star soup', t: 123456789 }];

  const text = fx.exportWishes(wishes, 'my-wishes.txt', mockDoc);
  assert.match(text, /"Star soup"/);
  assert.match(text, /Dreamer/);

  // Verify invisible download link was created and added to document body
  const links = mockDoc.body.querySelectorAll('a');
  assert.ok(links.length > 0, 'Download link <a> should have been created in body');
  const downloadLink = links[0];
  assert.strictEqual(downloadLink.getAttribute('download'), 'my-wishes.txt');
});

/* =========================================================================
   2. Local Storage Management (pip:wall) Tests
   ========================================================================= */
test('saveLocalWish and loadLocalWishes maintain newest-first LIFO display order across reloads', () => {
  const memoryStore = {};
  global.PIP = {
    store: {
      get: (k, def) => (k in memoryStore ? memoryStore[k] : def),
      set: (k, v) => { memoryStore[k] = String(v); }
    }
  };

  // Submit Wish A, then submit Wish B
  const wishA = { n: 'Visitor', w: 'Wish A', t: 100000 };
  const wishB = { n: 'Visitor', w: 'Wish B', t: 200000 };

  fx.saveLocalWish(wishA);
  fx.saveLocalWish(wishB);

  // Simulate page reload
  const loaded = fx.loadLocalWishes();
  assert.strictEqual(loaded.length, 2, 'Must load both wishes');
  assert.strictEqual(loaded[0].w, 'Wish B', 'Newly submitted Wish B must be at the top (index 0)');
  assert.strictEqual(loaded[1].w, 'Wish A', 'Older Wish A must follow below Wish B (index 1)');
});

test('loadLocalWishes normalizes legacy FIFO stored wishes to newest-first order', () => {
  const legacyData = [
    { n: 'First', w: 'Wish 1', t: 1000 },
    { n: 'Second', w: 'Wish 2', t: 2000 },
    { n: 'Third', w: 'Wish 3', t: 3000 }
  ];
  const memoryStore = { wall: JSON.stringify(legacyData) };
  global.PIP = {
    store: {
      get: (k, def) => (k in memoryStore ? memoryStore[k] : def),
      set: (k, v) => { memoryStore[k] = String(v); }
    }
  };

  const loaded = fx.loadLocalWishes();
  assert.strictEqual(loaded[0].w, 'Wish 3', 'Most recent wish (highest timestamp) must be first');
  assert.strictEqual(loaded[1].w, 'Wish 2');
  assert.strictEqual(loaded[2].w, 'Wish 1', 'Oldest wish must be last');
});

test('deleteLocalWish removes wish by index and keeps others intact', () => {
  const memoryStore = {
    wall: JSON.stringify([
      { n: 'B', w: 'Wish 2', t: 2000 },
      { n: 'A', w: 'Wish 1', t: 1000 }
    ])
  };
  global.PIP = {
    store: {
      get: (k, def) => (k in memoryStore ? memoryStore[k] : def),
      set: (k, v) => { memoryStore[k] = String(v); }
    }
  };

  // Deleting index 0 (Wish 2) should leave Wish 1
  const updated = fx.deleteLocalWish(0);
  assert.strictEqual(updated.length, 1);
  assert.strictEqual(updated[0].w, 'Wish 1');
  assert.strictEqual(JSON.parse(memoryStore.wall)[0].w, 'Wish 1');
});

/* =========================================================================
   3. Note Creation & Seed Protection Tests
   ========================================================================= */
test('createNoteElement for seeded wishes (isOwn=false) has NO delete button', () => {
  const mockDoc = createInteractiveMockDocument();
  const seedWish = fx.SEEDS[0];

  const note = fx.createNoteElement(seedWish, 0, mockDoc, false);
  assert.ok(note, 'Note element must be created');
  assert.strictEqual(note.querySelector('.note-del'), null, 'Seeded notes must NEVER have a delete button');
  assert.strictEqual(note.children.length, 2, 'Seeded note should only have p and span');
});

test('createNoteElement for visitor wish (isOwn=true) renders accessible delete button', () => {
  const mockDoc = createInteractiveMockDocument();
  const userWish = { n: 'Visitor', w: 'Sunny tomorrow' };

  const note = fx.createNoteElement(userWish, 0, mockDoc, true);
  assert.ok(note, 'Note element must be created');

  const delBtn = note.querySelector('.note-del');
  assert.ok(delBtn, 'Visitor note must have a .note-del button');
  assert.strictEqual(delBtn.tagName, 'BUTTON', 'Delete control must be a native <button>');
  assert.match(delBtn.getAttribute('aria-label'), /Delete wish/, 'Must have descriptive aria-label');
  assert.strictEqual(delBtn.textContent, '✕');
});

/* =========================================================================
   4. Delete Confirmation Step & Keyboard Accessibility Tests
   ========================================================================= */
test('delete button triggers confirm step with Yes and Cancel buttons', () => {
  const mockDoc = createInteractiveMockDocument();
  const userWish = { n: 'Visitor', w: 'More soft rain' };
  let deletedItem = null;
  let deletedIdx = null;

  const note = fx.createNoteElement(userWish, 0, mockDoc, true, (item, idx) => {
    deletedItem = item;
    deletedIdx = idx;
  });

  const delBtn = note.querySelector('.note-del');
  assert.ok(delBtn);

  // Click delete button
  delBtn.click();

  // Verify confirmation prompt appeared
  const confirmBox = note.querySelector('.note-confirm');
  assert.ok(confirmBox, 'Confirmation dialog .note-confirm must appear after clicking delete');
  assert.strictEqual(confirmBox.getAttribute('role'), 'group');
  assert.match(confirmBox.getAttribute('aria-label'), /Confirm wish deletion/);

  const yesBtn = confirmBox.querySelector('.btn-confirm-yes');
  const noBtn = confirmBox.querySelector('.btn-confirm-no');
  assert.ok(yesBtn, 'Confirm Delete button must exist');
  assert.ok(noBtn, 'Cancel button must exist');

  // Verify focus was transferred to confirmation button for keyboard accessibility
  assert.strictEqual(yesBtn.focused, true, 'Confirm button must be automatically focused for keyboard users');

  // Cancel deletion
  noBtn.click();
  assert.strictEqual(note.querySelector('.note-confirm'), null, 'Confirmation box must be dismissed on Cancel');
  assert.strictEqual(deletedItem, null, 'Wish must not be deleted when cancelled');

  // Click delete again and confirm
  delBtn.click();
  const confirmBox2 = note.querySelector('.note-confirm');
  assert.ok(confirmBox2);
  const yesBtn2 = confirmBox2.querySelector('.btn-confirm-yes');

  yesBtn2.click();
  assert.strictEqual(deletedItem, userWish, 'onDelete callback must be executed on confirmation');
  assert.strictEqual(deletedIdx, 0, 'onDelete must receive correct wish index');
});

test('delete confirmation can be dismissed using Escape key', () => {
  const mockDoc = createInteractiveMockDocument();
  const userWish = { n: 'Visitor', w: 'Nap time' };

  const note = fx.createNoteElement(userWish, 0, mockDoc, true);
  const delBtn = note.querySelector('.note-del');
  delBtn.click();

  const confirmBox = note.querySelector('.note-confirm');
  assert.ok(confirmBox);

  // Dispatch Escape key
  confirmBox.dispatchEvent({ type: 'keydown', key: 'Escape', stopPropagation: () => {} });
  assert.strictEqual(note.querySelector('.note-confirm'), null, 'Escape key must dismiss confirmation dialog');
  assert.strictEqual(delBtn.focused, true, 'Focus must return to delete button after dismiss');
});

/* =========================================================================
   5. HTML and CSS Integrity Tests
   ========================================================================= */
test('index.html contains #gbExport button inside .wall-actions', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  assert.match(html, /id=["']gbExport["']/, 'index.html must contain #gbExport button');
  assert.match(html, /class=["'][^"']*\bbtn-tool\b[^"']*["']/, '#gbExport must have class btn-tool');
  assert.match(html, /class=["'][^"']*\bwall-actions\b[^"']*["']/, 'index.html must contain .wall-actions container');
});

test('css/style.css defines styling for .wall-actions, .note-del, and .note-confirm', () => {
  const css = fs.readFileSync(CSS_PATH, 'utf8');
  assert.match(css, /\.wall-actions\s*\{/, 'style.css must define .wall-actions');
  assert.match(css, /\.btn-tool\s*\{/, 'style.css must define .btn-tool');
  assert.match(css, /\.note-del\s*\{/, 'style.css must define .note-del');
  assert.match(css, /\.note-confirm\s*\{/, 'style.css must define .note-confirm');
  assert.match(css, /\.btn-confirm-yes\s*\{/, 'style.css must define .btn-confirm-yes');
  assert.match(css, /\.btn-confirm-no\s*\{/, 'style.css must define .btn-confirm-no');
});
