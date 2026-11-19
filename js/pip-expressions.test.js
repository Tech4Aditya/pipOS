const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const HTML_PATH = path.resolve(__dirname, '..', 'index.html');
const CSS_PATH = path.resolve(__dirname, '..', 'css', 'style.css');
const PIP_JS_PATH = path.resolve(__dirname, 'pip.js');

test('index.html contains nose trigger, new mouth shapes, and preserves accessible description', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  // Verify interactive nose element exists
  assert.match(html, /id=["']pipNose["']/, 'Pip SVG must contain #pipNose element');

  // Verify surprised and yawn mouth SVG shapes exist
  assert.match(html, /class=["'][^"']*\bmouth-surprised\b[^"']*["']/, 'Must contain .mouth-surprised group');
  assert.match(html, /class=["'][^"']*\bmouth-yawn\b[^"']*["']/, 'Must contain .mouth-yawn group');

  // Verify description is strictly unchanged for accessibility and canon
  assert.match(html, /<desc id=["']pipD["']>A cute baby with a round skull face, glowing amber eyes, a tiny crooked smile and a starry nightcap with a pink bow, floating on a cloud and waving\.<\/desc>/,
    'Pip canon description must remain strictly unchanged');
});

test('css/style.css defines CSS classes for is-surprised, is-shy, and is-yawn', () => {
  const css = fs.readFileSync(CSS_PATH, 'utf8');

  assert.match(css, /\.pip-svg\.is-surprised\s+\.mouth-surprised/, 'Must style surprised mouth');
  assert.match(css, /\.pip-svg\.is-surprised\s+\.lid/, 'Must style surprised open lids');
  assert.match(css, /\.pip-svg\.is-shy\s+\.lid/, 'Must style shy bashful lids');
  assert.match(css, /\.pip-svg\.is-shy\s+\.p-cheek/, 'Must style shy blushing cheeks');
  assert.match(css, /\.pip-svg\.is-yawn\s+\.mouth-yawn/, 'Must style yawn open mouth');
  assert.match(css, /\.pip-svg\.is-yawn\s+\.lid/, 'Must style sleepy yawn lids');
  assert.match(css, /\.pip-svg\s+#pipNose/, 'Must style interactive nose hover states');
});

test('js/pip.js implements and exports expression triggers (surprise, shy, yawn)', () => {
  const pipSrc = fs.readFileSync(PIP_JS_PATH, 'utf8');

  assert.match(pipSrc, /function\s+setExpression\s*\(/, 'Must define setExpression');
  assert.match(pipSrc, /function\s+surprise\s*\(/, 'Must define surprise helper');
  assert.match(pipSrc, /function\s+shy\s*\(/, 'Must define shy helper');
  assert.match(pipSrc, /function\s+yawn\s*\(/, 'Must define yawn helper');
  assert.match(pipSrc, /setExpression:\s*setExpression/, 'Must export setExpression');
  assert.match(pipSrc, /surprise:\s*surprise/, 'Must export surprise');
  assert.match(pipSrc, /shy:\s*shy/, 'Must export shy');
  assert.match(pipSrc, /yawn:\s*yawn/, 'Must export yawn');
});

test('js/pip.js hooks nose hover and double-click interactions', () => {
  const pipSrc = fs.readFileSync(PIP_JS_PATH, 'utf8');

  assert.match(pipSrc, /nose\.addEventListener\(['"]mouseenter['"]/, 'Nose must trigger on mouseenter');
  assert.match(pipSrc, /head\.addEventListener\(['"]click['"][\s\S]*?shy\(/, 'Rapid clicking head must trigger shy expression');
  assert.match(pipSrc, /mood\s*===\s*['"]night['"][\s\S]*?yawn\(/, 'Night idle loop must trigger yawn');
});

test('css/style.css defines @keyframes pipJiggle and .pip-svg.is-jiggling class', () => {
  const css = fs.readFileSync(CSS_PATH, 'utf8');

  assert.match(css, /@keyframes\s+pipJiggle/, 'Must define @keyframes pipJiggle');
  assert.match(css, /rotate\(-?5deg\)/, 'pipJiggle must include quick +/- 5 deg rotations');
  assert.match(css, /\.pip-svg\.is-jiggling/, 'Must style .pip-svg.is-jiggling');
});

test('js/pip.js implements pointerdown poke sound and jiggle reaction', () => {
  const pipSrc = fs.readFileSync(PIP_JS_PATH, 'utf8');

  assert.match(pipSrc, /svg\.addEventListener\(['"]pointerdown['"]/, 'Must attach pointerdown listener to #pipSvg');
  assert.match(pipSrc, /PIP\.audio\.note\(587,\s*\{\s*dur:\s*0\.12,\s*gain:\s*0\.18\s*\}\)/, 'Must trigger rising note at 587Hz');
  assert.match(pipSrc, /PIP\.audio\.note\(880,\s*\{\s*dur:\s*0\.18,\s*gain:\s*0\.15,\s*when:\s*0\.08\s*\}\)/, 'Must trigger rising note at 880Hz');
  assert.match(pipSrc, /is-jiggling/, 'Must apply .is-jiggling class');
  assert.match(pipSrc, /450/, 'Must remove .is-jiggling class after 450ms');
});
