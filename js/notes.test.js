const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT_DIR, 'index.html');
const NOTES_JS_PATH = path.join(ROOT_DIR, 'js', 'notes.js');
const CSS_PATH = path.join(ROOT_DIR, 'css', 'style.css');

test('js/notes.js exports valid notes API with parsing, sanitization, and metric methods', () => {
  assert.ok(fs.existsSync(NOTES_JS_PATH), 'js/notes.js must exist');
  const notes = require(NOTES_JS_PATH);

  assert.strictEqual(typeof notes.parseMarkdown, 'function', 'parseMarkdown must be a function');
  assert.strictEqual(typeof notes.sanitizeHtml, 'function', 'sanitizeHtml must be a function');
  assert.strictEqual(typeof notes.countMetrics, 'function', 'countMetrics must be a function');
  assert.strictEqual(typeof notes.exportNote, 'function', 'exportNote must be a function');
  assert.ok(notes.TEMPLATES && notes.TEMPLATES.journal, 'TEMPLATES must include journal');
});

test('parseMarkdown correctly renders headings, bold, italic, lists, and code blocks', () => {
  const notes = require(NOTES_JS_PATH);

  const md = '# Title\n## Subtitle\n**bold** and *italic*\n`inline code`\n- [ ] Task 1\n- [x] Task 2\n> Quoted advice';
  const html = notes.parseMarkdown(md);

  assert.match(html, /<h1>Title<\/h1>/);
  assert.match(html, /<h2>Subtitle<\/h2>/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<em>italic<\/em>/);
  assert.match(html, /<code>inline code<\/code>/);
  assert.match(html, /<li class=["']md-check-item["']>/);
  assert.match(html, /<blockquote>Quoted advice<\/blockquote>/);
});

test('parseMarkdown and sanitizeHtml strictly neutralize malicious XSS injections', () => {
  const notes = require(NOTES_JS_PATH);

  const malicious = '<script>alert("hacked")</script><img src="x" onerror="alert(1)">';
  const html = notes.parseMarkdown(malicious);

  assert.doesNotMatch(html, /<script>/i, 'Must not output raw script tag');
  assert.doesNotMatch(html, /onerror=/i, 'Must escape attributes and prevent executable handlers');
  assert.match(html, /&lt;script&gt;/i, 'Must entity-escape brackets');
});

test('countMetrics accurately computes words and character counts', () => {
  const notes = require(NOTES_JS_PATH);

  const sample = "The quick brown fox jumps over the lazy dog";
  const m = notes.countMetrics(sample);

  assert.strictEqual(m.words, 9, 'Must count exactly 9 words');
  assert.strictEqual(m.chars, sample.length, 'Must count exact characters');
  assert.ok(m.readingTimeMinutes >= 1, 'Reading time must be at least 1 min');
});

test('index.html contains #notes article window in #work section with editor and preview tabs', () => {
  assert.ok(fs.existsSync(HTML_PATH), 'index.html must exist');
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  assert.match(html, /<article\s+[^>]*id=["']notes["'][^>]*>/i, '#notes article must exist');
  assert.match(html, /class=["'][^"']*\bw-notes\b[^"']*["']/i, '#notes must have w-notes class');
  assert.match(html, /id=["']notesTitle["']>\s*pip-pad\.exe/i, 'Window title must be pip-pad.exe');

  assert.match(html, /id=["']notesEditor["']/, 'Must provide textarea notes editor');
  assert.match(html, /id=["']notesPreview["']/, 'Must provide live preview container');
  assert.match(html, /id=["']notesExportBtn["']/, 'Must provide export button');
  assert.match(html, /id=["']notesTemplateSelect["']/, 'Must provide template selector');

  assert.match(html, /<a\s+[^>]*href=["']#notes["'][^>]*>.*notes\.exe/is, 'Must include desktop icon link for notes.exe');
});

test('css/style.css defines styling for notes editor, preview, and markdown elements', () => {
  assert.ok(fs.existsSync(CSS_PATH), 'css/style.css must exist');
  const css = fs.readFileSync(CSS_PATH, 'utf8');

  assert.match(css, /\.w-notes/, 'Must define .w-notes styling');
  assert.match(css, /\.notes-editor/, 'Must define .notes-editor styles');
  assert.match(css, /\.notes-preview/, 'Must define .notes-preview styles');
  assert.match(css, /\.notes-toolbar/, 'Must define .notes-toolbar styles');
});
