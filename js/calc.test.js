const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT_DIR, 'index.html');
const CALC_JS_PATH = path.join(ROOT_DIR, 'js', 'calc.js');
const CSS_PATH = path.join(ROOT_DIR, 'css', 'style.css');

test('js/calc.js exports valid calculator API with arithmetic, scientific, and memory functions', () => {
  assert.ok(fs.existsSync(CALC_JS_PATH), 'js/calc.js must exist');
  const calc = require(CALC_JS_PATH);

  assert.strictEqual(typeof calc.inputDigit, 'function', 'inputDigit must be a function');
  assert.strictEqual(typeof calc.inputOperator, 'function', 'inputOperator must be a function');
  assert.strictEqual(typeof calc.inputBracket, 'function', 'inputBracket must be a function');
  assert.strictEqual(typeof calc.calculate, 'function', 'calculate must be a function');
  assert.strictEqual(typeof calc.scientificOp, 'function', 'scientificOp must be a function');
  assert.strictEqual(typeof calc.memoryOp, 'function', 'memoryOp must be a function');
  assert.strictEqual(typeof calc.countSheep, 'function', 'countSheep must be a function');
  assert.strictEqual(typeof calc.evaluateExpression, 'function', 'evaluateExpression must be a function');
  assert.strictEqual(typeof calc.toggleChimes, 'function', 'toggleChimes must be a function');
  assert.strictEqual(typeof calc.toggleAngleMode, 'function', 'toggleAngleMode must be a function');
});

test('basic arithmetic calculations evaluate correctly', () => {
  const calc = require(CALC_JS_PATH);

  // 12 + 8 = 20
  calc.clearAll();
  calc.inputDigit(1);
  calc.inputDigit(2);
  calc.inputOperator('+');
  calc.inputDigit(8);
  calc.calculate();
  assert.strictEqual(calc.getState().display, '20');

  // 20 * 3 = 60
  calc.inputOperator('×');
  calc.inputDigit(3);
  calc.calculate();
  assert.strictEqual(calc.getState().display, '60');

  // Division by zero handles safely without throwing unhandled exceptions
  calc.inputOperator('÷');
  calc.inputDigit(0);
  calc.calculate();
  assert.match(calc.getState().display, /Error/i, 'Division by zero must yield Error');
});

test('bracket parsing and nested expression evaluation evaluate accurately', () => {
  const calc = require(CALC_JS_PATH);

  // (2 + 3) * 4 = 20
  assert.strictEqual(calc.evaluateExpression('(2 + 3) * 4'), '20');

  // ((2 + 3) * 2) + 5 = 15
  assert.strictEqual(calc.evaluateExpression('((2 + 3) * 2) + 5'), '15');

  // Powers and brackets: (2 + 2) ^ 3 = 64
  assert.strictEqual(calc.evaluateExpression('(2 + 2) ^ 3'), '64');

  // Unbalanced brackets return Syntax Error
  assert.strictEqual(calc.evaluateExpression('(2 + 3 * 4'), 'Syntax Error');
});

test('scientific operations evaluate correctly (sqrt, factorial, powers, trig, log)', () => {
  const calc = require(CALC_JS_PATH);

  // sqrt(144) = 12
  calc.clearAll();
  calc.inputDigit(1);
  calc.inputDigit(4);
  calc.inputDigit(4);
  calc.scientificOp('sqrt');
  assert.strictEqual(calc.getState().display, '12');

  // factorial(5) = 120
  calc.clearAll();
  calc.inputDigit(5);
  calc.scientificOp('fact');
  assert.strictEqual(calc.getState().display, '120');

  // 5! via expression parser
  assert.strictEqual(calc.evaluateExpression('5!'), '120');

  // log(100) = 2
  calc.clearAll();
  calc.inputDigit(1);
  calc.inputDigit(0);
  calc.inputDigit(0);
  calc.scientificOp('log');
  assert.strictEqual(calc.getState().display, '2');

  // ln(e) = 1
  assert.strictEqual(calc.evaluateExpression('ln(e)'), '1');

  // Trigonometry: sin(90) in deg = 1
  assert.strictEqual(calc.evaluateExpression('sin(90)', false), '1');
  assert.strictEqual(calc.evaluateExpression('cos(0)', false), '1');

  // pi constant
  calc.scientificOp('pi');
  assert.match(calc.getState().display, /^3\.1415/);
});

test('memory registers, chime toggle, and sheep counting Easter egg work as expected', () => {
  const calc = require(CALC_JS_PATH);

  calc.clearAll();
  calc.inputDigit(4);
  calc.inputDigit(2);
  calc.memoryOp('M+');
  assert.strictEqual(calc.getState().memory, 42);
  assert.strictEqual(calc.getState().hasMemory, true);

  // Clear display and recall
  calc.clearAll();
  calc.memoryOp('MR');
  assert.strictEqual(calc.getState().display, '42');

  calc.memoryOp('MC');
  assert.strictEqual(calc.getState().hasMemory, false);

  // Toggle chimes
  const chimesInitial = calc.getState().chimesEnabled;
  calc.toggleChimes();
  assert.strictEqual(calc.getState().chimesEnabled, !chimesInitial);
  calc.toggleChimes();

  // Count sheep
  calc.countSheep();
  assert.match(calc.getState().display, /1 🐑/);
});

test('index.html contains #calc article window in #work section with LCD display and keypad', () => {
  assert.ok(fs.existsSync(HTML_PATH), 'index.html must exist');
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  assert.match(html, /<article\s+[^>]*id=["']calc["'][^>]*>/i, '#calc article must exist in index.html');
  assert.match(html, /class=["'][^"']*\bw-calc\b[^"']*["']/i, '#calc must have w-calc class');
  assert.match(html, /id=["']calcTitle["']>\s*starlight-calc\.exe/i, 'Window title must be starlight-calc.exe');

  assert.match(html, /id=["']calcDisplay["']/, 'Must provide LCD digital display');
  assert.match(html, /id=["']calcExpr["']/, 'Must provide expression tape');
  assert.match(html, /id=["']calcKeys["']/, 'Must provide calculator keypad');
  assert.match(html, /id=["']calcMuteBtn["']/, 'Must provide chime toggle button');

  assert.match(html, /<a\s+[^>]*href=["']#calc["'][^>]*>.*calc\.exe/is, 'Must include desktop icon link for calc.exe');
  assert.match(html, /<a\s+[^>]*href=["']#calc["'][^>]*>.*Starlight Calc/is, 'Must include start menu link for Starlight Calc');
});

test('css/style.css defines styling for retro calculator and LCD display', () => {
  assert.ok(fs.existsSync(CSS_PATH), 'css/style.css must exist');
  const css = fs.readFileSync(CSS_PATH, 'utf8');

  assert.match(css, /\.w-calc/, 'Must define .w-calc styling');
  assert.match(css, /\.calc-screen/, 'Must define .calc-screen styles');
  assert.match(css, /\.calc-grid/, 'Must define .calc-grid layout');
  assert.match(css, /\.calc-btn/, 'Must define .calc-btn styles');
});

test('multi-term decimal input operates correctly without blocking trailing terms (Fixes #224)', () => {
  const calc = require(CALC_JS_PATH);

  // 12.5 + 3.5 = 16
  calc.clearAll();
  calc.inputDigit(1);
  calc.inputDigit(2);
  calc.inputDecimal();
  calc.inputDigit(5);
  assert.strictEqual(calc.getState().display, '12.5');

  calc.inputOperator('+');
  calc.inputDigit(3);
  calc.inputDecimal(); // must NOT be blocked!
  calc.inputDigit(5);
  assert.strictEqual(calc.getState().display, '3.5');

  calc.calculate();
  assert.strictEqual(calc.getState().display, '16');

  // Multi-term within bracket expressions e.g. (1.5 * 2.5)
  calc.clearAll();
  calc.inputBracket('(');
  calc.inputDigit(1);
  calc.inputDecimal();
  calc.inputDigit(5);
  assert.strictEqual(calc.getState().display, '(1.5');
  calc.inputDecimal(); // Duplicate decimal on same token must be ignored
  assert.strictEqual(calc.getState().display, '(1.5');
});
