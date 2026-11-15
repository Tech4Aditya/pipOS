const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PIP_JS_PATH = path.join(ROOT_DIR, 'js', 'pip.js');
const MAIN_JS_PATH = path.join(ROOT_DIR, 'js', 'main.js');

test('js/pip.js exports look() and glance() methods on PIP.pip', () => {
  const pipSrc = fs.readFileSync(PIP_JS_PATH, 'utf8');

  // Verify look and glance definitions
  assert.match(pipSrc, /function\s+look\s*\(/, 'pip.js must define look()');
  assert.match(pipSrc, /function\s+glance\s*\(/, 'pip.js must define glance()');

  // Verify exports on PIP.pip
  assert.match(pipSrc, /look:\s*look/, 'PIP.pip must export look');
  assert.match(pipSrc, /glance:\s*glance/, 'PIP.pip must export glance');
});

test('js/main.js initNavSpy hooks into section observer to trigger glance', () => {
  const mainSrc = fs.readFileSync(MAIN_JS_PATH, 'utf8');

  // Verify initNavSpy checks for section transition
  assert.match(mainSrc, /initNavSpy\s*\(\)/, 'main.js must define initNavSpy');
  assert.match(mainSrc, /currentSection/, 'initNavSpy must track currentSection state');

  // Verify hook into PIP.pip glance or look
  assert.match(mainSrc, /PIP\.pip\.glance|PIP\.pip\.look/,
    'initNavSpy must hook into PIP.pip.glance or PIP.pip.look on section change');

  // Verify disabled for reduced motion
  assert.match(mainSrc, /reduce\.matches/,
    'initNavSpy must verify reduced motion preference before triggering glance');
});

test('pip glance honors reduced motion preference', () => {
  const pipSrc = fs.readFileSync(PIP_JS_PATH, 'utf8');

  // Verify glance function starts by checking reduce.matches
  assert.match(pipSrc, /function\s+glance[\s\S]*?reduce\s*&&\s*reduce\.matches\s*\)\s*return/,
    'glance() must return immediately when reduce.matches is true');
});

test('look() function handles both coordinate numbers and DOM element targets', () => {
  const pipSrc = fs.readFileSync(PIP_JS_PATH, 'utf8');

  // Verify look handles target elements with getBoundingClientRect
  assert.match(pipSrc, /typeof\s+x\s*===\s*['"]object['"][\s\S]*?getBoundingClientRect/,
    'look() must accept a DOM element and compute its target coordinates');
});
