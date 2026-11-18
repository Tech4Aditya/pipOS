'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

// Mock DOM elements for Window Manager tests
function createMockElement(id, classes = []) {
  const classList = new Set(classes);
  const dataset = {};
  const children = [];
  const style = {};
  const listeners = {};

  const el = {
    id,
    dataset,
    style,
    tagName: 'DIV',
    classList: {
      add: (...classes) => classes.forEach(c => classList.add(c)),
      remove: (...classes) => classes.forEach(c => classList.delete(c)),
      contains: (c) => classList.has(c),
      toggle: (c) => {
        if (classList.has(c)) classList.delete(c);
        else classList.add(c);
      }
    },
    getAttribute: (attr) => (attr === 'style' ? style.cssText || '' : null),
    setAttribute: (attr, val) => { if (attr === 'style') style.cssText = val; },
    addEventListener: (event, handler) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(handler);
    },
    querySelector: (sel) => {
      if (sel === '.win-btn-max') return children.find(c => c.classList.contains('win-btn-max')) || null;
      if (sel === '.win-bar') return children.find(c => c.classList.contains('win-bar')) || null;
      if (sel === '.win-actions') return children.find(c => c.classList.contains('win-actions')) || null;
      return null;
    },
    appendChild: (child) => {
      children.push(child);
      return child;
    }
  };
  return el;
}

const WindowManager = require('./window-manager.js');

test('WindowManager: bringToFront increments z-index and marks focused window', () => {
  const winA = createMockElement('winA', ['win']);
  const winB = createMockElement('winB', ['win']);

  WindowManager.bringToFront(winA);
  assert.strictEqual(winA.classList.contains('is-focused'), true);
  const zA = winA.style.zIndex;

  WindowManager.bringToFront(winB);
  assert.strictEqual(winB.classList.contains('is-focused'), true);
  assert.strictEqual(winA.classList.contains('is-focused'), false);
  assert.ok(winB.style.zIndex > zA);
});

test('WindowManager: maximize toggles is-maximized class and preserves state', () => {
  const win = createMockElement('winLab', ['win']);
  WindowManager.maximize(win);
  assert.strictEqual(win.classList.contains('is-maximized'), true);
  assert.strictEqual(win.classList.contains('is-snapped-left'), false);

  WindowManager.restore(win);
  assert.strictEqual(win.classList.contains('is-maximized'), false);
});

test('WindowManager: snap applies 50% split classes and removes maximize', () => {
  const win = createMockElement('winNotes', ['win', 'is-maximized']);
  WindowManager.snap(win, 'left');
  assert.strictEqual(win.classList.contains('is-snapped-left'), true);
  assert.strictEqual(win.classList.contains('is-maximized'), false);

  WindowManager.snap(win, 'right');
  assert.strictEqual(win.classList.contains('is-snapped-right'), true);
  assert.strictEqual(win.classList.contains('is-snapped-left'), false);
});
