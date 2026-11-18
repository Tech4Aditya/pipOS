const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Visual Regression: Root directory remains strictly build-free', () => {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assert.strictEqual(pkg.dependencies, undefined, 'Root application must stay build-free with zero runtime dependencies');
  }
  assert.strictEqual(fs.existsSync(path.join(__dirname, '..', 'node_modules')), false,
    'Root directory must NOT contain node_modules');
});

test('Visual Regression: tests/ directory contains isolated package.json and config', () => {
  const pkgPath = path.join(__dirname, '..', 'tests', 'package.json');
  assert.ok(fs.existsSync(pkgPath), 'tests/package.json must exist');

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert.strictEqual(pkg.private, true, 'tests/package.json must be private');
  assert.ok(pkg.scripts && pkg.scripts.test, 'Must define "test" script');
  assert.ok(pkg.scripts && pkg.scripts['test:update'], 'Must define "test:update" script');
  assert.ok(pkg.devDependencies && pkg.devDependencies['@playwright/test'], 'Must have @playwright/test dev dependency');

  const configPath = path.join(__dirname, '..', 'tests', 'playwright.config.js');
  assert.ok(fs.existsSync(configPath), 'tests/playwright.config.js must exist');

  const configCode = fs.readFileSync(configPath, 'utf8');
  assert.match(configCode, /desktop-day/, 'Must configure desktop-day project');
  assert.match(configCode, /desktop-night/, 'Must configure desktop-night project');
  assert.match(configCode, /tablet/, 'Must configure tablet project');
  assert.match(configCode, /mobile/, 'Must configure mobile project');
});

test('Visual Regression: tests/visual.spec.js covers key components and themes', () => {
  const specPath = path.join(__dirname, '..', 'tests', 'visual.spec.js');
  assert.ok(fs.existsSync(specPath), 'tests/visual.spec.js must exist');

  const specCode = fs.readFileSync(specPath, 'utf8');
  assert.match(specCode, /toHaveScreenshot/, 'Must perform toHaveScreenshot assertions');
  assert.match(specCode, /#pipSvg/, 'Must wait for mascot SVG');
  assert.match(specCode, /#hello/, 'Must capture hero section');
  assert.match(specCode, /#work/, 'Must capture work workbench section');
  assert.match(specCode, /#story/, 'Must capture storybook section');
});

test('Visual Regression: README.md documents test commands and snapshot updates', () => {
  const readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
  assert.match(readme, /tests/i, 'README must mention tests folder');
  assert.match(readme, /npm test/, 'README must explain running npm test');
  assert.match(readme, /test:update|--update-snapshots/, 'README must explain how to update snapshots');
});
