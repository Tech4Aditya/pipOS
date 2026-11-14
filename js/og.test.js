const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const HTML_PATH = path.resolve(__dirname, '..', 'index.html');
const IMG_PATH = path.resolve(__dirname, '..', 'assets', 'og-preview.png');

test('index.html contains complete Open Graph and Twitter Card tags', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  // Helper to extract meta tag content by property or name
  function getMeta(attr, value) {
    const regex = new RegExp(`<meta\\s+[^>]*${attr}=["']${value}["'][^>]*content=["']([^"']*)["']`, 'i');
    const match = html.match(regex);
    if (match) return match[1];
    const reverseRegex = new RegExp(`<meta\\s+[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${value}["']`, 'i');
    const revMatch = html.match(reverseRegex);
    return revMatch ? revMatch[1] : null;
  }

  // Open Graph Core Tags
  const ogTitle = getMeta('property', 'og:title');
  const ogDesc = getMeta('property', 'og:description');
  const ogType = getMeta('property', 'og:type');
  const ogUrl = getMeta('property', 'og:url');
  const ogImage = getMeta('property', 'og:image');
  const ogImageWidth = getMeta('property', 'og:image:width');
  const ogImageHeight = getMeta('property', 'og:image:height');
  const ogImageType = getMeta('property', 'og:image:type');
  const ogImageAlt = getMeta('property', 'og:image:alt');
  const ogSiteName = getMeta('property', 'og:site_name');

  assert.ok(ogTitle, 'og:title must be present');
  assert.match(ogTitle, /Pip/i, 'og:title should mention Pip');

  assert.ok(ogDesc, 'og:description must be present');
  assert.match(ogDesc, /dreams/i, 'og:description should describe the site');

  assert.strictEqual(ogType, 'website', 'og:type should be "website"');

  assert.ok(ogUrl, 'og:url must be present');
  assert.match(ogUrl, /^https?:\/\//, 'og:url must be an absolute URL');

  assert.ok(ogImage, 'og:image must be present');
  assert.match(ogImage, /^https?:\/\/.*\/assets\/og-preview\.png$/, 'og:image must point to the preview image');

  assert.strictEqual(ogImageWidth, '1200', 'og:image:width must be 1200');
  assert.strictEqual(ogImageHeight, '630', 'og:image:height must be 630');
  assert.strictEqual(ogImageType, 'image/png', 'og:image:type must be image/png');
  assert.ok(ogImageAlt, 'og:image:alt must be present for accessibility');
  assert.ok(ogSiteName, 'og:site_name must be present');

  // Twitter Card Tags
  const twCard = getMeta('name', 'twitter:card');
  const twTitle = getMeta('name', 'twitter:title');
  const twDesc = getMeta('name', 'twitter:description');
  const twImage = getMeta('name', 'twitter:image');
  const twImageAlt = getMeta('name', 'twitter:image:alt');

  assert.strictEqual(twCard, 'summary_large_image', 'twitter:card must be summary_large_image for 1200x630 banner');
  assert.ok(twTitle, 'twitter:title must be present');
  assert.ok(twDesc, 'twitter:description must be present');
  assert.ok(twImage, 'twitter:image must be present');
  assert.ok(twImageAlt, 'twitter:image:alt must be present');
});

test('Preview image exists, has exact 1200x630 dimensions, and is under 300 KB', () => {
  assert.ok(fs.existsSync(IMG_PATH), 'assets/og-preview.png must exist');

  const stats = fs.statSync(IMG_PATH);
  const sizeKb = stats.size / 1024;

  // WhatsApp requirement: image MUST be under 300 KB
  assert.ok(stats.size < 300 * 1024, `Image size (${sizeKb.toFixed(2)} KB) must be under 300 KB (WhatsApp limit)`);

  // Verify PNG header and dimensions directly from binary IHDR chunk
  const buf = fs.readFileSync(IMG_PATH);
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  assert.strictEqual(buf.readUInt32BE(0), 0x89504E47, 'File must have valid PNG signature');
  // IHDR width is at offset 16, height at offset 20
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);

  assert.strictEqual(width, 1200, 'Image width must be exactly 1200 px');
  assert.strictEqual(height, 630, 'Image height must be exactly 630 px');
});

test('Social platform debugger validation (LinkedIn, X, WhatsApp)', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  // Helper to extract content
  function getMeta(attr, value) {
    const regex = new RegExp(`<meta\\s+[^>]*${attr}=["']${value}["'][^>]*content=["']([^"']*)["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : null;
  }

  const ogTitle = getMeta('property', 'og:title');
  const ogDesc = getMeta('property', 'og:description');
  const ogImage = getMeta('property', 'og:image');
  const twCard = getMeta('name', 'twitter:card');
  const stats = fs.statSync(IMG_PATH);

  // 1. LinkedIn Post Inspector standards
  // LinkedIn requires title (<100 chars), description (<256 chars), 1.91:1 image, absolute URLs
  assert.ok(ogTitle.length <= 100, `LinkedIn title must be <= 100 chars (was ${ogTitle.length})`);
  assert.ok(ogDesc.length <= 256, `LinkedIn description must be <= 256 chars (was ${ogDesc.length})`);
  assert.ok(ogImage.startsWith('https://'), 'LinkedIn requires absolute HTTPS image URL');

  // 2. X / Twitter Card Validator standards
  // Requires summary_large_image, image ratio 1.91:1, title, description
  assert.strictEqual(twCard, 'summary_large_image', 'X requires summary_large_image');

  // 3. WhatsApp crawler standards
  // WhatsApp discards previews if image size >= 300 KB, requires og:title, og:image
  assert.ok(stats.size < 300 * 1024, 'WhatsApp requires preview image to be under 300 KB');
  assert.ok(ogTitle.length > 0, 'WhatsApp requires non-empty title');
  assert.ok(ogImage.length > 0, 'WhatsApp requires non-empty image URL');
});
