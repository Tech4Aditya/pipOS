const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT_DIR, 'index.html');
const TASKBAR_JS_PATH = path.join(ROOT_DIR, 'js', 'taskbar.js');
const CSS_PATH = path.join(ROOT_DIR, 'css', 'style.css');

test('js/taskbar.js exports valid taskbar API with menu lifecycle methods', () => {
  assert.ok(fs.existsSync(TASKBAR_JS_PATH), 'js/taskbar.js must exist');
  const taskbar = require(TASKBAR_JS_PATH);

  assert.strictEqual(typeof taskbar.openMenu, 'function', 'openMenu must be a function');
  assert.strictEqual(typeof taskbar.closeMenu, 'function', 'closeMenu must be a function');
  assert.strictEqual(typeof taskbar.toggleMenu, 'function', 'toggleMenu must be a function');
  assert.strictEqual(typeof taskbar.toggleFullscreen, 'function', 'toggleFullscreen must be a function');
  assert.strictEqual(typeof taskbar.isOpen, 'function', 'isOpen must be a function');
});

test('index.html contains #startMenu component with accessible navigation items', () => {
  assert.ok(fs.existsSync(HTML_PATH), 'index.html must exist');
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  assert.match(html, /id=["']startMenu["']/i, '#startMenu container must exist in index.html');
  assert.match(html, /role=["']menu["']/i, '#startMenu must declare role="menu"');

  // Verify key items
  assert.match(html, /href=["']#lab["']/i, 'Start menu must link to Lullaby Lab');
  assert.match(html, /href=["']#lights["']/i, 'Start menu must link to Nightlights');
  assert.match(html, /href=["']#blocks["']/i, 'Start menu must link to Blocks');
  assert.match(html, /href=["']#story["']/i, 'Start menu must link to Storybook');
  assert.match(html, /data-start-act=["']fullscreen["']/i, 'Start menu must provide fullscreen action');
});

test('css/style.css defines styling for start menu, items, and mobile drawer', () => {
  assert.ok(fs.existsSync(CSS_PATH), 'css/style.css must exist');
  const css = fs.readFileSync(CSS_PATH, 'utf8');

  assert.match(css, /\.start-menu/, 'Must define .start-menu styling');
  assert.match(css, /\.start-menu-head/, 'Must define .start-menu-head');
  assert.match(css, /\.start-menu-list/, 'Must define .start-menu-list');
  assert.match(css, /\.start-item/, 'Must define .start-item styling');
});

/* =========================================================================
   Retro Desktop Window Manager: Process Pills & Z-Index Focus Stacking
   ========================================================================= */
test('index.html contains #taskbarRunning container inside taskbar', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  assert.match(html, /id=["']taskbarRunning["']/, 'index.html must contain #taskbarRunning container');
  assert.match(html, /class=["'][^"']*\btaskbar-running\b[^"']*["']/, '#taskbarRunning must have class taskbar-running');
  assert.match(html, /role=["']toolbar["']/, '#taskbarRunning must declare role="toolbar"');
});

test('css/style.css defines styling for .taskbar-running, .taskbar-pill, .win.is-focused, and .win.is-minimized', () => {
  const css = fs.readFileSync(CSS_PATH, 'utf8');
  assert.match(css, /\.taskbar-running\s*\{/, 'Must define .taskbar-running flex container');
  assert.match(css, /\.taskbar-pill|\.taskbar-item/, 'Must define .taskbar-pill button styling');
  assert.match(css, /\.win\.is-focused\s*\{/, 'Must define .win.is-focused focus ring styling');
  assert.match(css, /\.win\.is-minimized\s*\{/, 'Must define .win.is-minimized hidden state');
  assert.match(css, /\.taskbar-pill-dot|\.taskbar-indicator/, 'Must define .taskbar-pill-dot status indicator');
});

test('js/taskbar.js exports window manager lifecycle, stacking, and minimization API', () => {
  const taskbar = require(TASKBAR_JS_PATH);
  assert.strictEqual(typeof taskbar.bringToFront, 'function', 'bringToFront must be exported');
  assert.strictEqual(typeof taskbar.minimizeWindow, 'function', 'minimizeWindow must be exported');
  assert.strictEqual(typeof taskbar.restoreWindow, 'function', 'restoreWindow must be exported');
  assert.strictEqual(typeof taskbar.toggleWindow, 'function', 'toggleWindow must be exported');
  assert.strictEqual(typeof taskbar.initWindowManager, 'function', 'initWindowManager must be exported');
  assert.strictEqual(typeof taskbar.getZIndex, 'function', 'getZIndex must be exported');
});

function createMockWindowManagerDocument() {
  function MockElement(tagName, ownerDoc) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDoc || null;
    this.children = [];
    this.parentNode = null;
    this.className = '';
    this.style = {
      display: '',
      zIndex: '',
      setProperty: (k, v) => { this.style[k] = v; }
    };
    this.attributes = {};
    this.eventListeners = {};
    this._textContent = '';
    this.hidden = false;
  }

  Object.defineProperty(MockElement.prototype, 'textContent', {
    get() { return this._textContent; },
    set(v) { this._textContent = String(v); }
  });

  Object.defineProperty(MockElement.prototype, 'classList', {
    get() {
      const self = this;
      return {
        add(cls) {
          const list = (self.className || '').split(/\s+/).filter(Boolean);
          if (!list.includes(cls)) { list.push(cls); self.className = list.join(' '); }
        },
        remove(cls) {
          const list = (self.className || '').split(/\s+/).filter(x => x !== cls);
          self.className = list.join(' ');
        },
        contains(cls) {
          return (self.className || '').split(/\s+/).includes(cls);
        }
      };
    }
  });

  MockElement.prototype.setAttribute = function (k, v) { this.attributes[k] = String(v); };
  MockElement.prototype.getAttribute = function (k) { return this.attributes[k] || null; };

  MockElement.prototype.appendChild = function (child) {
    child.parentNode = this;
    if (!child.ownerDocument && this.ownerDocument) {
      child.ownerDocument = this.ownerDocument;
    }
    this.children.push(child);
    return child;
  };

  MockElement.prototype.closest = function (selector) {
    let curr = this;
    const isClass = selector.startsWith('.');
    const cls = isClass ? selector.slice(1) : '';
    const isTag = !isClass;
    while (curr) {
      if (isClass && curr.classList.contains(cls)) return curr;
      if (isTag && curr.tagName === selector.toUpperCase()) return curr;
      curr = curr.parentNode;
    }
    return null;
  };

  MockElement.prototype.querySelector = function (selector) {
    function search(node) {
      for (const child of node.children) {
        if (selector.startsWith('#') && child.attributes.id === selector.slice(1)) return child;
        if (selector.startsWith('.') && child.classList.contains(selector.slice(1))) return child;
        if (selector.startsWith('[data-win-id=')) {
          const match = selector.match(/\[data-win-id=["']?([^"'\]]+)["']?\]/);
          if (match && (child.attributes['data-win-id'] === match[1] || child.getAttribute('data-win-id') === match[1])) {
            return child;
          }
        }
        if (child.tagName === selector.toUpperCase()) return child;
        const res = search(child);
        if (res) return res;
      }
      return null;
    }
    return search(this);
  };

  MockElement.prototype.querySelectorAll = function (selector) {
    const results = [];
    function search(node) {
      for (const child of node.children) {
        if (selector === '.win' && child.classList.contains('win')) results.push(child);
        else if (selector === '.win[data-foldable]' && child.classList.contains('win') && 'data-foldable' in child.attributes) results.push(child);
        else if (selector.startsWith('.') && child.classList.contains(selector.slice(1))) results.push(child);
        search(child);
      }
    }
    search(this);
    return results;
  };

  MockElement.prototype.addEventListener = function (event, fn) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(fn);
  };

  MockElement.prototype.dispatchEvent = function (eventObj) {
    const type = typeof eventObj === 'string' ? eventObj : eventObj.type;
    const listeners = this.eventListeners[type] || [];
    for (const fn of listeners) fn.call(this, eventObj);
  };

  MockElement.prototype.click = function () {
    this.dispatchEvent({ type: 'click', preventDefault: () => {}, stopPropagation: () => {} });
  };

  const body = new MockElement('BODY');
  const doc = {
    body,
    eventListeners: {},
    addEventListener(event, fn) {
      if (!this.eventListeners[event]) this.eventListeners[event] = [];
      this.eventListeners[event].push(fn);
    },
    dispatchEvent(eventObj) {
      const type = typeof eventObj === 'string' ? eventObj : eventObj.type;
      const listeners = this.eventListeners[type] || [];
      for (const fn of listeners) fn.call(this, eventObj);
    },
    createElement(tag) { return new MockElement(tag, doc); },
    getElementById(id) {
      function search(node) {
        if (node.attributes.id === id) return node;
        for (const child of node.children) {
          const res = search(child);
          if (res) return res;
        }
        return null;
      }
      return search(body);
    },
    querySelector(sel) { return body.querySelector(sel); },
    querySelectorAll(sel) { return body.querySelectorAll(sel); }
  };
  body.ownerDocument = doc;

  return doc;
}

test('Window Manager: bringToFront increases z-index above other windows and sets focus state', () => {
  const taskbar = require(TASKBAR_JS_PATH);
  const mockDoc = createMockWindowManagerDocument();

  // Create taskbar running container
  const running = mockDoc.createElement('DIV');
  running.setAttribute('id', 'taskbarRunning');
  running.className = 'taskbar-running';
  mockDoc.body.appendChild(running);

  // Create Window A
  const winA = mockDoc.createElement('ARTICLE');
  winA.className = 'win w-lab';
  winA.setAttribute('id', 'lab');
  winA.setAttribute('data-foldable', '');
  const titleA = mockDoc.createElement('SPAN');
  titleA.className = 'win-title';
  titleA.textContent = 'lullaby-lab.exe';
  winA.appendChild(titleA);
  const bodyA = mockDoc.createElement('DIV');
  bodyA.className = 'win-body';
  winA.appendChild(bodyA);
  mockDoc.body.appendChild(winA);

  // Create Window B
  const winB = mockDoc.createElement('ARTICLE');
  winB.className = 'win w-term';
  winB.setAttribute('id', 'terminal');
  winB.setAttribute('data-foldable', '');
  const titleB = mockDoc.createElement('SPAN');
  titleB.className = 'win-title';
  titleB.textContent = 'pip-term.exe';
  winB.appendChild(titleB);
  const bodyB = mockDoc.createElement('DIV');
  bodyB.className = 'win-body';
  winB.appendChild(bodyB);
  mockDoc.body.appendChild(winB);

  // Initialize window manager
  taskbar.initWindowManager(mockDoc);

  // Verify taskbar buttons were dynamically generated for both windows
  const pillA = running.querySelector('[data-win-id="lab"]');
  const pillB = running.querySelector('[data-win-id="terminal"]');
  assert.ok(pillA, 'Taskbar pill for lab must exist');
  assert.ok(pillB, 'Taskbar pill for terminal must exist');

  // Focus Window A
  taskbar.bringToFront(winA);
  assert.strictEqual(winA.classList.contains('is-focused'), true);
  assert.strictEqual(pillA.classList.contains('is-focused'), true);
  assert.strictEqual(pillA.getAttribute('aria-pressed'), 'true');
  const zA1 = taskbar.getZIndex(winA);

  // Focus Window B
  taskbar.bringToFront(winB);
  assert.strictEqual(winB.classList.contains('is-focused'), true);
  assert.strictEqual(winA.classList.contains('is-focused'), false, 'Window A must lose focus when B is focused');
  assert.strictEqual(pillB.classList.contains('is-focused'), true);
  assert.strictEqual(pillA.classList.contains('is-focused'), false);
  const zB1 = taskbar.getZIndex(winB);
  assert.ok(zB1 > zA1, 'Focused Window B must have higher z-index than Window A');

  // Focus Window A again
  taskbar.bringToFront(winA);
  const zA2 = taskbar.getZIndex(winA);
  assert.ok(zA2 > zB1, 'Window A must now have higher z-index than Window B');
  assert.strictEqual(winA.classList.contains('is-focused'), true);
});

test('Window Manager: minimizeWindow tucks window into taskbar button with active indicator', () => {
  const taskbar = require(TASKBAR_JS_PATH);
  const mockDoc = createMockWindowManagerDocument();

  const running = mockDoc.createElement('DIV');
  running.setAttribute('id', 'taskbarRunning');
  mockDoc.body.appendChild(running);

  const win = mockDoc.createElement('ARTICLE');
  win.className = 'win w-blocks';
  win.setAttribute('id', 'blocks');
  win.setAttribute('data-foldable', '');
  const title = mockDoc.createElement('SPAN');
  title.className = 'win-title';
  title.textContent = 'rattle-and-blocks.exe';
  const body = mockDoc.createElement('DIV');
  body.className = 'win-body';
  win.appendChild(title);
  win.appendChild(body);
  mockDoc.body.appendChild(win);

  taskbar.initWindowManager(mockDoc);
  const pill = running.querySelector('[data-win-id="blocks"]');
  assert.ok(pill);

  // Minimize window
  taskbar.minimizeWindow(win);
  assert.strictEqual(win.classList.contains('is-minimized'), true, 'Window must receive .is-minimized class');
  assert.strictEqual(body.hidden, true, 'Window body must be hidden when minimized');
  assert.strictEqual(pill.classList.contains('is-minimized'), true, 'Taskbar pill must receive .is-minimized');
  assert.strictEqual(pill.getAttribute('aria-pressed'), 'false');
  assert.ok(pill.querySelector('.taskbar-indicator'), 'Taskbar pill must display active indicator');
});

test('Window Manager: restoreWindow untucks window from taskbar button and brings it to front', () => {
  const taskbar = require(TASKBAR_JS_PATH);
  const mockDoc = createMockWindowManagerDocument();

  const running = mockDoc.createElement('DIV');
  running.setAttribute('id', 'taskbarRunning');
  mockDoc.body.appendChild(running);

  const win = mockDoc.createElement('ARTICLE');
  win.className = 'win w-stars';
  win.setAttribute('id', 'stars');
  win.setAttribute('data-foldable', '');
  const title = mockDoc.createElement('SPAN');
  title.className = 'win-title';
  title.textContent = 'pip-stars.exe';
  const body = mockDoc.createElement('DIV');
  body.className = 'win-body';
  win.appendChild(title);
  win.appendChild(body);
  mockDoc.body.appendChild(win);

  taskbar.initWindowManager(mockDoc);
  const pill = running.querySelector('[data-win-id="stars"]');

  // First minimize, then restore
  taskbar.minimizeWindow(win);
  assert.strictEqual(win.classList.contains('is-minimized'), true);

  taskbar.restoreWindow(win);
  assert.strictEqual(win.classList.contains('is-minimized'), false, 'Restored window must not have .is-minimized');
  assert.strictEqual(body.hidden, false, 'Restored window body must be visible');
  assert.strictEqual(win.classList.contains('is-focused'), true, 'Restored window must be focused in front');
  assert.strictEqual(pill.classList.contains('is-minimized'), false);
  assert.strictEqual(pill.classList.contains('is-focused'), true);
  assert.strictEqual(pill.getAttribute('aria-pressed'), 'true');
});

test('Window Manager: toggleWindow alternates between minimize and focus/restore', () => {
  const taskbar = require(TASKBAR_JS_PATH);
  const mockDoc = createMockWindowManagerDocument();

  const running = mockDoc.createElement('DIV');
  running.setAttribute('id', 'taskbarRunning');
  mockDoc.body.appendChild(running);

  const win = mockDoc.createElement('ARTICLE');
  win.className = 'win w-notes';
  win.setAttribute('id', 'notes');
  win.setAttribute('data-foldable', '');
  const title = mockDoc.createElement('SPAN');
  title.className = 'win-title';
  title.textContent = 'pip-pad.exe';
  const body = mockDoc.createElement('DIV');
  body.className = 'win-body';
  win.appendChild(title);
  win.appendChild(body);
  mockDoc.body.appendChild(win);

  taskbar.initWindowManager(mockDoc);

  // Open and focused: toggleWindow minimizes
  taskbar.bringToFront(win);
  assert.strictEqual(win.classList.contains('is-focused'), true);
  taskbar.toggleWindow(win);
  assert.strictEqual(win.classList.contains('is-minimized'), true);

  // Minimized: toggleWindow restores
  taskbar.toggleWindow(win);
  assert.strictEqual(win.classList.contains('is-minimized'), false);
  assert.strictEqual(win.classList.contains('is-focused'), true);
});
