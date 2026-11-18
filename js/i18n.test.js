const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const i18n = require('./i18n.js');

test('TRANSLATIONS provides complete dictionaries for en and hi', () => {
  assert.ok(i18n.TRANSLATIONS, 'TRANSLATIONS should exist');
  assert.ok(i18n.TRANSLATIONS.en, 'English dictionary should exist');
  assert.ok(i18n.TRANSLATIONS.hi, 'Hindi dictionary should exist');
});

test('Hindi translation dictionary maintains 100% key parity with English', () => {
  const enKeys = Object.keys(i18n.TRANSLATIONS.en);
  const hiKeys = Object.keys(i18n.TRANSLATIONS.hi);

  assert.ok(enKeys.length > 20, 'Should have rich set of translation keys');
  for (const key of enKeys) {
    assert.ok(key in i18n.TRANSLATIONS.hi, `Key "${key}" missing from Hindi dictionary`);
    assert.ok(i18n.TRANSLATIONS.hi[key].length > 0, `Key "${key}" in Hindi dictionary must not be empty`);
  }
});

test('Story scenes in Hindi are concise and under 150 words per scene', () => {
  const storyKeys = ['story_p1', 'story_p2', 'story_p3', 'story_p4'];
  for (const key of storyKeys) {
    const text = i18n.TRANSLATIONS.hi[key];
    const words = text.trim().split(/\s+/).length;
    assert.ok(words > 5 && words < 150, `Story scene ${key} length (${words} words) should be under 150 words`);
  }
});

test('index.html contains data-i18n attributes matching translations', () => {
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Verify taskbar language button
  assert.match(html, /id=["']langBtn["']/, 'index.html must include #langBtn in taskbar');
  assert.match(html, /<script[^>]*src=["']js\/i18n\.js["']/, 'index.html must include js/i18n.js script');

  // Verify key data-i18n markers exist
  const sampleKeys = ['nav_pip', 'nav_work', 'hero_title', 'work_title', 'story_h1', 'wall_title'];
  for (const key of sampleKeys) {
    assert.match(html, new RegExp(`data-i18n=["']${key}["']`), `index.html must include data-i18n="${key}"`);
  }
});

test('i18n.t() translates dynamic strings and dispatches pip-language-change', () => {
  assert.strictEqual(typeof i18n.t, 'function', 'i18n.t should be a function');
  
  // Test English fallback / current
  i18n.apply('en');
  assert.strictEqual(i18n.t('Day'), 'Day');
  assert.strictEqual(i18n.t('Night'), 'Night');
  assert.strictEqual(i18n.t('Sound on'), 'Sound on');

  // Test Hindi translation
  i18n.apply('hi');
  assert.strictEqual(i18n.t('Day'), 'दिन');
  assert.strictEqual(i18n.t('Night'), 'रात');
  assert.strictEqual(i18n.t('Sound on'), 'ध्वनि चालू');

  // Test fallback for unknown key
  assert.strictEqual(i18n.t('NonExistentString123'), 'NonExistentString123');

  // Verify code dispatches pip-language-change
  const i18nSrc = fs.readFileSync(path.join(__dirname, 'i18n.js'), 'utf8');
  assert.match(i18nSrc, /pip-language-change/, 'i18n.js must dispatch pip-language-change event');
});

test('i18n detects locale from navigator.languages and falls back cleanly', () => {
  assert.strictEqual(typeof i18n.detectLocale, 'function', 'detectLocale must be exported');

  // Hindi priority in navigator.languages
  assert.strictEqual(i18n.detectLocale({ languages: ['hi-IN', 'en-US', 'en'] }), 'hi');
  assert.strictEqual(i18n.detectLocale({ languages: ['hi'] }), 'hi');
  assert.strictEqual(i18n.detectLocale({ languages: ['hi_NP', 'en'] }), 'hi');

  // English priority
  assert.strictEqual(i18n.detectLocale({ languages: ['en-GB', 'en', 'hi'] }), 'en');
  assert.strictEqual(i18n.detectLocale({ languages: ['en'] }), 'en');

  // Unsupported locales fall back to 'en'
  assert.strictEqual(i18n.detectLocale({ languages: ['fr-FR', 'de-DE', 'ja'] }), 'en');

  // Fallback to navigator.language when languages array is missing or empty
  assert.strictEqual(i18n.detectLocale({ languages: [], language: 'hi-IN' }), 'hi');
  assert.strictEqual(i18n.detectLocale({ language: 'en-US' }), 'en');
  assert.strictEqual(i18n.detectLocale({ userLanguage: 'hi' }), 'hi');

  // Null/undefined navigator falls back to 'en'
  assert.strictEqual(i18n.detectLocale(null), 'en');
  assert.strictEqual(i18n.detectLocale({}), 'en');
});

test('i18n getInitialLang respects configured localStorage and falls back to detection on first visit', () => {
  assert.strictEqual(typeof i18n.getInitialLang, 'function', 'getInitialLang must be exported');

  // Configured in localStorage: takes precedence over navigator.languages
  const storeWithHi = { get: (k) => (k === 'lang' ? 'hi' : null) };
  assert.strictEqual(i18n.getInitialLang({ languages: ['en-US'] }, storeWithHi), 'hi');

  const storeWithEn = { get: (k) => (k === 'lang' ? 'en' : null) };
  assert.strictEqual(i18n.getInitialLang({ languages: ['hi-IN'] }, storeWithEn), 'en');

  // First visit: unconfigured in localStorage (returns null), detects from navigator
  const unconfiguredStore = { get: () => null };
  assert.strictEqual(i18n.getInitialLang({ languages: ['hi-IN', 'en'] }, unconfiguredStore), 'hi');
  assert.strictEqual(i18n.getInitialLang({ languages: ['en-US'] }, unconfiguredStore), 'en');
  assert.strictEqual(i18n.getInitialLang({ languages: ['es-ES'] }, unconfiguredStore), 'en');
});

test('i18n.t() parameter interpolation replaces {placeholders} with provided values', () => {
  i18n.apply('en');

  // Single parameter and {count}
  assert.strictEqual(i18n.t('{count} dreams', { count: 5 }), '5 dreams');
  assert.strictEqual(i18n.t('{count} dreams', { count: 0 }), '0 dreams');

  // Direct numeric argument shorthand
  assert.strictEqual(i18n.t('{count} dreams', 42), '42 dreams');
  assert.strictEqual(i18n.t('{count} dreams', 0), '0 dreams');

  // Multiple named parameters
  assert.strictEqual(
    i18n.t('Page {current} of {total}', { current: 1, total: 6 }),
    'Page 1 of 6'
  );
  assert.strictEqual(
    i18n.t('Hello {name}! You have {count} wishes in {room}.', { name: 'Pip', count: 3, room: 'Attic' }),
    'Hello Pip! You have 3 wishes in Attic.'
  );

  // Unmatched placeholders remain intact
  assert.strictEqual(i18n.t('Hello {name}, visit {unknown}!', { name: 'Pip' }), 'Hello Pip, visit {unknown}!');
});

test('i18n.t() supports pipe-separated pluralization with count interpolation', () => {
  i18n.apply('en');

  // 2-part pipe: singular | plural
  const pipeString = '{count} dream | {count} dreams';
  assert.strictEqual(i18n.t(pipeString, { count: 1 }), '1 dream');
  assert.strictEqual(i18n.t(pipeString, { count: 2 }), '2 dreams');
  assert.strictEqual(i18n.t(pipeString, { count: 0 }), '0 dreams');
  assert.strictEqual(i18n.t(pipeString, 1), '1 dream');
  assert.strictEqual(i18n.t(pipeString, 10), '10 dreams');

  // 3-part pipe: zero | singular | plural
  const threePartPipe = 'No dreams | 1 dream | {count} dreams';
  assert.strictEqual(i18n.t(threePartPipe, { count: 0 }), 'No dreams');
  assert.strictEqual(i18n.t(threePartPipe, { count: 1 }), '1 dream');
  assert.strictEqual(i18n.t(threePartPipe, { count: 7 }), '7 dreams');

  // Dictionary plural keys
  assert.strictEqual(i18n.t('dreams_count', { count: 1 }), '1 dream delivered');
  assert.strictEqual(i18n.t('dreams_count', { count: 4 }), '4 dreams delivered');

  // In Hindi
  i18n.apply('hi');
  assert.strictEqual(i18n.t('dreams_count', { count: 1 }), '1 सपना पहुँचाया गया');
  assert.strictEqual(i18n.t('dreams_count', { count: 5 }), '5 सपने पहुँचाए गए');
});

test('i18n.t() supports object plural forms and ICU plural format', () => {
  i18n.apply('en');

  // Object plural forms: zero, one, other
  const pluralObj = {
    zero: 'No stars',
    one: '{count} star',
    other: '{count} stars'
  };
  assert.strictEqual(i18n.t(pluralObj, { count: 0 }), 'No stars');
  assert.strictEqual(i18n.t(pluralObj, { count: 1 }), '1 star');
  assert.strictEqual(i18n.t(pluralObj, { count: 9 }), '9 stars');

  // Singular / plural alias
  const aliasObj = {
    singular: '{count} wish',
    plural: '{count} wishes'
  };
  assert.strictEqual(i18n.t(aliasObj, { count: 1 }), '1 wish');
  assert.strictEqual(i18n.t(aliasObj, { count: 3 }), '3 wishes');

  // ICU MessageFormat plural syntax
  const icuString = '{count, plural, =0 {No dreams} one {# dream} other {# dreams}}';
  assert.strictEqual(i18n.t(icuString, { count: 0 }), 'No dreams');
  assert.strictEqual(i18n.t(icuString, { count: 1 }), '1 dream');
  assert.strictEqual(i18n.t(icuString, { count: 12 }), '12 dreams');

  // Custom plural formatting function via params
  const customPlural = i18n.t('badge', {
    count: 2,
    plural: (cnt) => (cnt === 2 ? 'a pair of badges' : `${cnt} badges`)
  });
  assert.strictEqual(customPlural, 'a pair of badges');

  // Translation entry as a function
  const fnEntry = (p) => `Total: ${p.count * 10} points`;
  assert.strictEqual(i18n.t(fnEntry, { count: 4 }), 'Total: 40 points');
});

test('i18n standalone plural formatting helper and plural rule methods', () => {
  i18n.apply('en');
  assert.strictEqual(typeof i18n.plural, 'function', 'i18n.plural must be exported');
  assert.strictEqual(typeof i18n.getPluralRule, 'function', 'i18n.getPluralRule must be exported');

  // i18n.plural with object forms
  assert.strictEqual(
    i18n.plural(1, { one: '{count} lullaby', other: '{count} lullabies' }),
    '1 lullaby'
  );
  assert.strictEqual(
    i18n.plural(5, { one: '{count} lullaby', other: '{count} lullabies' }),
    '5 lullabies'
  );
  assert.strictEqual(
    i18n.plural(0, { zero: 'No lullabies', one: '{count} lullaby', other: '{count} lullabies' }),
    'No lullabies'
  );

  // i18n.plural with string arguments shorthand
  assert.strictEqual(i18n.plural(1, 'star', 'stars'), '1 star');
  assert.strictEqual(i18n.plural(3, 'star', 'stars'), '3 stars');
  assert.strictEqual(i18n.plural(1, '{count} bell', '{count} bells'), '1 bell');
  assert.strictEqual(i18n.plural(4, '{count} bell', '{count} bells'), '4 bells');

  // getPluralRule / selectPlural
  assert.strictEqual(i18n.getPluralRule(1, 'en'), 'one');
  assert.strictEqual(i18n.getPluralRule(2, 'en'), 'other');
  assert.strictEqual(i18n.getPluralRule(0, 'hi'), 'one');
  assert.strictEqual(i18n.getPluralRule(1, 'hi'), 'one');
  assert.strictEqual(i18n.getPluralRule(5, 'hi'), 'other');
});
