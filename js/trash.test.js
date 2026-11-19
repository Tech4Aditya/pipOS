const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT_DIR, 'index.html');
const CSS_PATH = path.join(ROOT_DIR, 'css', 'style.css');
const MAIN_JS_PATH = path.join(ROOT_DIR, 'js', 'main.js');

test('index.html contains #trashBtn desktop shortcut for Nightmares', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  assert.match(html, /<button\s+[^>]*id=["']trashBtn["'][^>]*>/i, '#trashBtn must exist in index.html');
  assert.match(html, /class=["'][^"']*\bic-trash\b[^"']*["']/i, '#trashBtn must contain .ic-trash icon');
  assert.match(html, /Nightmares/i, '#trashBtn must display Nightmares label');
});

test('css/style.css defines .ic-trash and bursting animation for #trashBtn', () => {
  const css = fs.readFileSync(CSS_PATH, 'utf8');
  assert.match(css, /\.ic-trash\s*\{/, '.ic-trash styling must be defined');
  assert.match(css, /#trashBtn\.is-bursting/, '#trashBtn.is-bursting animation state must be defined');
  assert.match(css, /@keyframes\s+trash-burst/, 'trash-burst keyframes must be defined');
});

test('js/main.js implements initTrash with sound, starlight particles, toast, and sticker unlock', () => {
  const mainSrc = fs.readFileSync(MAIN_JS_PATH, 'utf8');

  // Verify function definition and safe initialization
  assert.match(mainSrc, /function\s+initTrash\s*\(/, 'main.js must define initTrash');
  assert.match(mainSrc, /safe\(\s*['"]trash['"]\s*,\s*initTrash\s*\)/, 'main.js must register safe("trash", initTrash)');

  // Verify high pentatonic chord audio note
  assert.match(mainSrc, /audio\.note\(\s*1046\s*,\s*\{\s*dur:\s*0\.8\s*,\s*gain:\s*0\.15\s*\}\)/,
    'Must play high pentatonic chord audio.note(1046, { dur: 0.8, gain: 0.15 })');

  // Verify 10 starlight particles
  assert.match(mainSrc, /p\s*<\s*10/, 'Must spawn 10 mini starlight particles in a loop');
  assert.match(mainSrc, /spawn(?:Sparkle|\(cx,\s*cy)/, 'Must spawn particles from button coordinates');

  // Verify gentle toast
  assert.match(mainSrc, /toast\(\s*['"]✨ All nightmares cleared\. Sweet dreams only!['"]\s*\)/,
    'Must display gentle toast "✨ All nightmares cleared. Sweet dreams only!"');

  // Verify achievement sticker unlock
  assert.match(mainSrc, /PIP\.stickers\.unlock\(\s*['"](?:trash|route7)['"]\s*\)/,
    'Must unlock achievement sticker (trash or route7)');
});

test('trash click event triggers audio note, 10 starlight particles, toast, and sticker unlock in mock runtime', () => {
  const mainSrc = fs.readFileSync(MAIN_JS_PATH, 'utf8');

  let playedNote = null;
  const spawnedParticles = [];
  let toastMsg = null;
  let unlockedSticker = null;

  const mockTrashBtn = {
    classList: {
      add: () => {},
      remove: () => {}
    },
    getBoundingClientRect: () => ({ left: 18, top: 200, width: 92, height: 60 }),
    addEventListener: (evt, handler) => {
      if (evt === 'click') {
        mockTrashBtn._click = handler;
      }
    }
  };

  const mockPIP = {
    $: (sel) => (sel === '#trashBtn' ? mockTrashBtn : null),
    $$: () => [],
    store: { get: () => '', set: () => {} },
    clamp: (v, min, max) => Math.min(max, Math.max(min, v)),
    reduceMotion: { matches: false },
    audio: {
      isOn: () => true,
      note: (freq, opts) => {
        playedNote = { freq, opts };
      }
    },
    fx: {
      particles: {
        spawn: (x, y, opts) => {
          spawnedParticles.push({ x, y, opts });
        }
      },
      init: () => {}
    },
    stickers: {
      unlock: (id) => {
        unlockedSticker = id;
        return id === 'route7';
      },
      init: () => {}
    },
    toast: (msg) => {
      toastMsg = msg;
    },
    pip: { init: () => {} },
    toys: { init: () => {} }
  };

  // Run in clean sandbox context
  const mockWindow = {
    PIP: mockPIP,
    document: {
      documentElement: { classList: { toggle: () => {} } },
      querySelector: () => null
    },
    setTimeout: (fn) => fn(),
    addEventListener: () => {}
  };

  const runCode = new Function('window', 'document', 'setTimeout', mainSrc);
  runCode(mockWindow, mockWindow.document, mockWindow.setTimeout);

  // Trigger the click handler
  assert.ok(typeof mockTrashBtn._click === 'function', 'Click handler must be registered on #trashBtn');
  mockTrashBtn._click();

  // Verify audio note
  assert.ok(playedNote, 'audio.note must be called');
  assert.strictEqual(playedNote.freq, 1046, 'Played frequency must be 1046');
  assert.strictEqual(playedNote.opts.dur, 0.8, 'Played duration must be 0.8');
  assert.strictEqual(playedNote.opts.gain, 0.15, 'Played gain must be 0.15');

  // Verify 10 particles
  assert.strictEqual(spawnedParticles.length, 10, 'Must spawn exactly 10 starlight particles');
  assert.strictEqual(spawnedParticles[0].x, 18 + 92 / 2, 'Particle x must match button center');
  assert.strictEqual(spawnedParticles[0].y, 200 + 60 / 2, 'Particle y must match button center');

  // Verify toast
  assert.strictEqual(toastMsg, '✨ All nightmares cleared. Sweet dreams only!');

  // Verify sticker unlock
  assert.ok(unlockedSticker === 'trash' || unlockedSticker === 'route7', 'Must unlock trash or route7 sticker');
});

const PipTrash = require('./trash.js');

test.describe('Desktop Trash Can & Soft File Deletion Engine (pip-trash)', () => {
  test.beforeEach(() => {
    PipTrash.emptyTrash();
  });

  test('moveToTrash creates valid metadata envelope', () => {
    const item = PipTrash.moveToTrash('/home/pip/test_story.txt', 'Once upon a midnight dream...');
    assert.ok(item.id.startsWith('trash_'));
    assert.strictEqual(item.name, 'test_story.txt');
    assert.strictEqual(item.originalPath, '/home/pip/test_story.txt');
    assert.strictEqual(item.content, 'Once upon a midnight dream...');
    assert.strictEqual(item.size, 29);
    assert.ok(item.deletedAt > 0);

    const list = PipTrash.listTrash();
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].id, item.id);
  });

  test('restore removes item from trash and recovers file', () => {
    const item = PipTrash.moveToTrash('/home/pip/lullaby.md', '# Lullaby Notes');
    assert.strictEqual(PipTrash.listTrash().length, 1);

    const restored = PipTrash.restore(item.id);
    assert.strictEqual(restored.id, item.id);
    assert.strictEqual(restored.originalPath, '/home/pip/lullaby.md');
    assert.strictEqual(PipTrash.listTrash().length, 0);
  });

  test('restore throws on non-existent item id', () => {
    assert.throws(() => {
      PipTrash.restore('trash_invalid_9999');
    }, /Item not found in trash/);
  });

  test('emptyTrash wipes all deleted items', () => {
    PipTrash.moveToTrash('/home/pip/note1.txt', 'Note 1');
    PipTrash.moveToTrash('/home/pip/note2.txt', 'Note 2');
    PipTrash.moveToTrash('/home/pip/note3.txt', 'Note 3');
    assert.strictEqual(PipTrash.listTrash().length, 3);

    const clearedCount = PipTrash.emptyTrash();
    assert.strictEqual(clearedCount, 3);
    assert.strictEqual(PipTrash.listTrash().length, 0);
  });

  test('getItem retrieves specific trash entry', () => {
    const item = PipTrash.moveToTrash('/home/pip/secret.txt', 'gold star');
    const found = PipTrash.getItem(item.id);
    assert.deepStrictEqual(found, item);

    const notFound = PipTrash.getItem('trash_unknown');
    assert.strictEqual(notFound, null);
  });
});
