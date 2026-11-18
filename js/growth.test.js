const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const HTML_PATH = path.resolve(__dirname, '..', 'index.html');
const TOYS_JS_PATH = path.resolve(__dirname, 'toys.js');
const CSS_PATH = path.resolve(__dirname, '..', 'css', 'style.css');

test('index.html contains pip-growth-chart.exe in Work section', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  assert.match(html, /<article[^>]*id=["']growth["'][^>]*class=["'][^"']*w-growth[^"']*["']/i,
    'Work section must include growth chart article');
  assert.match(html, /pip-growth-chart\.exe/i, 'Window title must be pip-growth-chart.exe');
  assert.match(html, /id=["']growthChart["']/i, 'Chart container must have id="growthChart"');
});

test('growth chart defines 5 milestones with accessible progress bars', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  const steps = html.match(/<li\s+class=["']growth-step["']/g);
  assert.ok(steps, 'Growth steps must exist');
  assert.strictEqual(steps.length, 5, 'There must be exactly 5 nursery milestones');

  // Verify milestone skills
  assert.match(html, /First hiccup/);
  assert.match(html, /First lullaby/);
  assert.match(html, /Nightlight keeper/);
  assert.match(html, /Dream delivery route/);
  assert.match(html, /Junior Dream Engineer/);

  // Verify accessible progress bars in growth chart
  const progressBars = html.match(/class=["']growth-bar["'][^>]*role=["']progressbar["']/g) ||
                       html.match(/role=["']progressbar["'][^>]*class=["']growth-bar["']/g);
  assert.ok(progressBars, 'Progress bars must exist');
  assert.strictEqual(progressBars.length, 5, 'Every milestone must have an accessible progress bar');
});

test('js/toys.js implements initGrowthChart with IntersectionObserver animation', () => {
  const toysSrc = fs.readFileSync(TOYS_JS_PATH, 'utf8');

  assert.match(toysSrc, /function\s+initGrowthChart\s*\(/, 'toys.js must define initGrowthChart');
  assert.match(toysSrc, /initGrowthChart\(\)/, 'PIP.toys.init must call initGrowthChart()');
  assert.match(toysSrc, /PIP\.watchVisible\(chart/, 'Growth chart must animate via watchVisible IntersectionObserver');
});

test('css/style.css links initial zero-fill state and reveals width on .is-visible with reduced-motion support', () => {
  const css = fs.readFileSync(CSS_PATH, 'utf8');

  // Verify CSS defines zero initial fill for JS users before entering viewport
  assert.match(css, /html\.js\s+\.growth-fill\s*\{\s*width:\s*0%?;?\s*\}/,
    'html.js .growth-fill must initialize at width: 0%');

  // Verify CSS triggers expansion to --progress once .is-visible is attached
  assert.match(css, /html\.js\s+\.growth-chart\.is-visible\s+\.growth-fill\s*\{\s*width:\s*calc\(var\(--progress/,
    'html.js .growth-chart.is-visible .growth-fill must expand to var(--progress)');

  // Verify reduced-motion override scopes correctly inside @media (prefers-reduced-motion)
  assert.match(css, /@media[^{]*prefers-reduced-motion[^{]*\{[\s\S]*?\.growth-fill[^{]*\{[^}]*transition-duration:\s*0\.01s/,
    'Reduced motion media query must override .growth-fill transition-duration to 0.01s');

  // Verify mobile responsive override resets grid span (allowing grouped selectors)
  assert.match(css, /@media[^{]*max-width:\s*960px[^{]*\{[\s\S]*?\.w-growth[^{]*\{\s*grid-column:\s*auto;?\s*\}/,
    'Mobile media query must reset .w-growth grid-column to auto within grouped or standalone selectors');
});
