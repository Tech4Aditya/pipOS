const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Window Management: index.html markup and taskbar dock', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  assert.ok(html.includes('id="taskbarMinimized"'), 'index.html must contain #taskbarMinimized dock');
  assert.ok(html.includes('class="task-minimized"'), 'must include .task-minimized class');
  assert.ok(html.includes('aria-label="Minimized Windows"'), 'must have accessible region label');
});

test('Window Management: js/main.js initFoldable and focus management contract', () => {
  const mainJs = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');

  assert.ok(mainJs.includes('initFoldable'), 'main.js must define initFoldable');
  assert.ok(mainJs.includes('updateTaskbarDock'), 'must implement updateTaskbarDock helper');
  assert.ok(mainJs.includes('tb-min-btn'), 'must generate .tb-min-btn for minimized windows');
  assert.ok(mainJs.includes('bringToFront'), 'must implement bringToFront z-index management');
  assert.ok(mainJs.includes('win-active'), 'must manage .win-active focus styling class');
  assert.ok(mainJs.includes('aria-expanded'), 'must maintain aria-expanded attribute state');
});

test('Window Management: css/style.css styling contract', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');

  assert.ok(css.includes('.task-minimized'), 'style.css must define .task-minimized');
  assert.ok(css.includes('.tb-min-btn'), 'style.css must define .tb-min-btn');
  assert.ok(css.includes('.win.win-active'), 'style.css must define .win.win-active focus styling');
});
