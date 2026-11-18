const test = require('node:test');
const assert = require('node:assert');
const wall = require('./wall.js');

test('sanitize strips control and invisible characters', () => {
  const dirty = 'Hello\u0000\u0007\u200BWorld\uFEFF  ';
  assert.strictEqual(wall.sanitize(dirty), 'HelloWorld');
  assert.strictEqual(wall.sanitize(null), '');
  assert.strictEqual(wall.sanitize(undefined), '');
  assert.strictEqual(wall.sanitize(123), '');
});

test('validateWish rejects empty or whitespace-only wishes', () => {
  assert.strictEqual(wall.validateWish('', 'Alice').ok, false);
  assert.strictEqual(wall.validateWish('   \t\n  ', 'Alice').ok, false);
  assert.match(wall.validateWish('', 'Alice').error, /Write a wish first/);
});

test('validateWish accepts valid wish and defaults empty name', () => {
  const res = wall.validateWish('I wish for soup', '');
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.wish, 'I wish for soup');
  assert.strictEqual(res.name, 'A sleepy visitor');
});

test('validateWish enforces length limits', () => {
  const longName = 'A'.repeat(50);
  const longWish = 'W'.repeat(200);
  const res = wall.validateWish(longWish, longName);
  assert.strictEqual(res.ok, false); // wish > 120 rejected
  assert.match(res.error, /under 120 characters/);

  const validLongWish = 'W'.repeat(120);
  const res2 = wall.validateWish(validLongWish, longName);
  assert.strictEqual(res2.ok, true);
  assert.strictEqual(res2.name.length, 20); // name trimmed to 20
});

test('checkRateLimit enforces cooldown', () => {
  const now = 1000000;
  // First wish: allowed
  const first = wall.checkRateLimit([], now);
  assert.strictEqual(first.allowed, true);

  // Second wish 5 seconds later: blocked by 15s cooldown
  const second = wall.checkRateLimit([now], now + 5000);
  assert.strictEqual(second.allowed, false);
  assert.strictEqual(second.wait, 10);
  assert.match(second.error, /Please wait 10s/);

  // Third wish 16 seconds later: allowed
  const third = wall.checkRateLimit([now], now + 16000);
  assert.strictEqual(third.allowed, true);
});

test('checkRateLimit enforces maximum per window', () => {
  const now = 2000000;
  const history = [
    now - 50000,
    now - 40000,
    now - 30000,
    now - 20000,
    now - 16000
  ];
  const check = wall.checkRateLimit(history, now);
  assert.strictEqual(check.allowed, false);
  assert.match(check.error, /Too many wishes/);
});

test('parseRemotePayload parses Firebase object map', () => {
  const firebaseData = {
    '-N1': { n: 'Wisp', w: 'Soft rain', t: 100 },
    '-N2': { n: 'Hoot', w: 'Warm lamp', t: 200 },
    'invalid': { n: 'Bad' } // missing w
  };
  const list = wall.parseRemotePayload(firebaseData, 'firebase');
  assert.strictEqual(list.length, 2);
  assert.strictEqual(list[0].n, 'Hoot'); // sorted by t descending
  assert.strictEqual(list[1].n, 'Wisp');
});

test('parseRemotePayload parses Supabase/REST array', () => {
  const supabaseData = [
    { n: 'Fern', w: 'Sleepy fox', t: 300 },
    { n: 'Boo-ton', w: 'No hiccups', created_at: '2026-10-18T12:00:00Z' }
  ];
  const list = wall.parseRemotePayload(supabaseData, 'supabase');
  assert.strictEqual(list.length, 2);
  assert.strictEqual(list[0].w, 'Sleepy fox');
  assert.strictEqual(list[1].w, 'No hiccups');
});

test('parseRemotePayload handles empty/malformed data without throwing', () => {
  assert.deepStrictEqual(wall.parseRemotePayload(null, 'firebase'), []);
  assert.deepStrictEqual(wall.parseRemotePayload(undefined, 'supabase'), []);
  assert.deepStrictEqual(wall.parseRemotePayload('not-json', 'firebase'), []);
});

/* =========================================================================
   Offline Resilient Sync Queue (pip:pending_wishes) Tests
   ========================================================================= */
test('getPendingWishes returns empty array when queue is empty or malformed', () => {
  const store = { get: () => '[]', set: () => {} };
  assert.deepStrictEqual(wall.getPendingWishes(store), []);

  const brokenStore = { get: () => 'not-json{', set: () => {} };
  assert.deepStrictEqual(wall.getPendingWishes(brokenStore), []);
});

test('queuePendingWish validates, sanitizes, and queues wishes in store', () => {
  const memory = {};
  const mockStore = {
    get: (k, d) => (k in memory ? memory[k] : d),
    set: (k, v) => { memory[k] = String(v); }
  };

  // Rejects invalid wish
  assert.strictEqual(wall.queuePendingWish(null, mockStore), false);
  assert.strictEqual(wall.queuePendingWish({ w: '' }, mockStore), false);
  assert.strictEqual(wall.queuePendingWish({ w: '   ' }, mockStore), false);

  // Queues valid wish
  const ok = wall.queuePendingWish({ w: 'Soft raindrops and warm tea', n: 'Dreamer', t: 123456 }, mockStore);
  assert.strictEqual(ok, true);

  const queue = wall.getPendingWishes(mockStore);
  assert.strictEqual(queue.length, 1);
  assert.strictEqual(queue[0].w, 'Soft raindrops and warm tea');
  assert.strictEqual(queue[0].n, 'Dreamer');
  assert.strictEqual(queue[0].t, 123456);

  // Queues second wish
  wall.queuePendingWish({ w: 'More sleepy stories' }, mockStore);
  const queue2 = wall.getPendingWishes(mockStore);
  assert.strictEqual(queue2.length, 2);
  assert.strictEqual(queue2[1].w, 'More sleepy stories');
  assert.strictEqual(queue2[1].n, 'A sleepy visitor');
});

test('clearPendingWishes empties queued wishes', () => {
  const memory = {
    'pip:pending_wishes': JSON.stringify([{ w: 'Test wish', n: 'Visitor', t: 100 }])
  };
  const mockStore = {
    get: (k, d) => (k in memory ? memory[k] : d),
    set: (k, v) => { memory[k] = String(v); }
  };

  assert.strictEqual(wall.getPendingWishes(mockStore).length, 1);
  wall.clearPendingWishes(mockStore);
  assert.deepStrictEqual(wall.getPendingWishes(mockStore), []);
});

test('syncPendingWishes transmits queued wishes to backend and clears queue on completion', async () => {
  const memory = {};
  const mockStore = {
    get: (k, d) => (k in memory ? memory[k] : d),
    set: (k, v) => { memory[k] = String(v); }
  };

  wall.queuePendingWish({ w: 'Wish 1', n: 'Visitor 1', t: 100 }, mockStore);
  wall.queuePendingWish({ w: 'Wish 2', n: 'Visitor 2', t: 200 }, mockStore);
  assert.strictEqual(wall.getPendingWishes(mockStore).length, 2);

  const posted = [];
  const origFetch = global.fetch;
  global.fetch = async (url, opts) => {
    posted.push({ url, body: JSON.parse(opts.body) });
    return { ok: true, json: async () => ({}) };
  };

  try {
    await new Promise((resolve) => {
      wall.syncPendingWishes({ url: 'https://pip-wall.firebaseio.com/wishes' }, (count) => {
        assert.strictEqual(count, 2);
        resolve();
      }, mockStore);
    });

    assert.strictEqual(posted.length, 2);
    assert.strictEqual(posted[0].body.w, 'Wish 1');
    assert.strictEqual(posted[1].body.w, 'Wish 2');
    assert.deepStrictEqual(wall.getPendingWishes(mockStore), [], 'Queue must be empty after full sync');
  } finally {
    global.fetch = origFetch;
  }
});

test('syncPendingWishes stops and preserves remaining wishes if a network error occurs', async () => {
  const memory = {};
  const mockStore = {
    get: (k, d) => (k in memory ? memory[k] : d),
    set: (k, v) => { memory[k] = String(v); }
  };

  wall.queuePendingWish({ w: 'Success Wish', n: 'Visitor 1', t: 100 }, mockStore);
  wall.queuePendingWish({ w: 'Failing Wish', n: 'Visitor 2', t: 200 }, mockStore);

  let callCount = 0;
  const origFetch = global.fetch;
  global.fetch = async () => {
    callCount++;
    if (callCount === 1) return { ok: true, json: async () => ({}) };
    return { ok: false, status: 503 };
  };

  try {
    await new Promise((resolve) => {
      wall.syncPendingWishes({ url: 'https://pip-wall.firebaseio.com/wishes' }, (count) => {
        assert.strictEqual(count, 1, 'Only 1 wish succeeded before error');
        resolve();
      }, mockStore);
    });

    const remaining = wall.getPendingWishes(mockStore);
    assert.strictEqual(remaining.length, 1, 'Failing wish must remain in queue for retry');
    assert.strictEqual(remaining[0].w, 'Failing Wish');
  } finally {
    global.fetch = origFetch;
  }
});
