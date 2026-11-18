/* wall.js: Shared Wish Wall backend client, rate limiting, and input validation.
   Supports Firebase Realtime Database, Supabase PostgREST, custom REST, and local fallback.
   Safe rendering: enforces textContent and sanitization to prevent XSS. */
(function () {
  'use strict';

  var COOLDOWN_MS = 15000; // 15s cooldown between wishes
  var WINDOW_MS = 600000;   // 10 minutes rate limit window
  var MAX_PER_WINDOW = 5;   // max 5 wishes per 10 minutes

  // Strip control chars, null bytes, invisible zero-width unicode
  function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '').trim();
  }

  // Validate wish and name length & content
  function validateWish(wish, name) {
    var cleanWish = sanitize(wish);
    var cleanName = sanitize(name);

    if (!cleanWish) {
      return { ok: false, error: 'Write a wish first. Even a tiny one counts.' };
    }

    if (cleanWish.length > 120) {
      return { ok: false, error: 'Your wish is too long! Keep it under 120 characters.' };
    }

    if (cleanName.length > 20) {
      cleanName = cleanName.slice(0, 20);
    }

    return {
      ok: true,
      wish: cleanWish,
      name: cleanName || 'A sleepy visitor'
    };
  }

  // Rate limiting check
  function checkRateLimit(history, now) {
    now = typeof now === 'number' ? now : Date.now();
    var validHistory = (Array.isArray(history) ? history : []).filter(function (t) {
      return typeof t === 'number' && now - t < WINDOW_MS;
    });

    if (validHistory.length > 0) {
      var last = validHistory[validHistory.length - 1];
      var diff = now - last;
      if (diff < COOLDOWN_MS) {
        var waitSec = Math.ceil((COOLDOWN_MS - diff) / 1000);
        return {
          allowed: false,
          wait: waitSec,
          error: 'Pip is still reading your last wish! Please wait ' + waitSec + 's.',
          history: validHistory
        };
      }
    }

    if (validHistory.length >= MAX_PER_WINDOW) {
      return {
        allowed: false,
        wait: Math.ceil((WINDOW_MS - (now - validHistory[0])) / 1000),
        error: 'Pip needs a nap! Too many wishes pinned recently. Try again soon.',
        history: validHistory
      };
    }

    return { allowed: true, history: validHistory };
  }

  // Parse and normalize payloads from Firebase, Supabase, or custom REST
  function parseRemotePayload(data, type) {
    var list = [];
    if (!data) return list;

    if (type === 'firebase') {
      // Firebase RTDB returns an object of { "-Key...": { n, w, t } }
      if (typeof data === 'object' && !Array.isArray(data)) {
        Object.keys(data).forEach(function (k) {
          var item = data[k];
          if (item && typeof item.w === 'string') {
            list.push({
              n: sanitize(item.n) || 'A sleepy visitor',
              w: sanitize(item.w).slice(0, 120),
              t: typeof item.t === 'number' ? item.t : 0
            });
          }
        });
        list.sort(function (a, b) { return (b.t || 0) - (a.t || 0); });
      }
    } else {
      // Supabase or custom REST returns an array [ { n, w, t }, ... ]
      if (Array.isArray(data)) {
        data.forEach(function (item) {
          if (item && typeof item.w === 'string') {
            list.push({
              n: sanitize(item.n) || 'A sleepy visitor',
              w: sanitize(item.w).slice(0, 120),
              t: typeof item.t === 'number' ? item.t : (Date.parse(item.created_at) || 0)
            });
          }
        });
      }
    }
    return list.slice(0, 30);
  }

  function getFetch() {
    if (typeof window !== 'undefined' && window.fetch) return window.fetch.bind(window);
    if (typeof global !== 'undefined' && global.fetch) return global.fetch.bind(global);
    if (typeof fetch === 'function') return fetch;
    return null;
  }

  // Fetch remote wishes with timeout and safe fallback
  function fetchWishes(backend, cb) {
    var fetchFn = getFetch();
    if (!backend || !backend.url || !fetchFn) {
      return cb(null);
    }

    var url = backend.url;
    var type = backend.type || 'firebase';
    var headers = Object.assign({}, backend.headers || {});

    if (type === 'firebase') {
      url = url.replace(/\/?(\.json)?$/, '') + '.json?orderBy="$key"&limitToLast=30';
    } else if (type === 'supabase') {
      url = url + '?select=n,w,t&order=t.desc&limit=30';
      if (backend.apiKey) {
        headers['apikey'] = backend.apiKey;
        headers['Authorization'] = 'Bearer ' + backend.apiKey;
      }
    }

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 6000) : 0;

    fetchFn(url, {
      method: 'GET',
      headers: headers,
      signal: controller ? controller.signal : undefined
    })
    .then(function (res) {
      if (timer) clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var items = parseRemotePayload(data, type);
      cb(items);
    })
    .catch(function () {
      if (timer) clearTimeout(timer);
      cb(null); // Keep console clean, return null to trigger local fallback
    });
  }

  // Post remote wish with safe fallback
  function postWish(backend, wishData, cb) {
    var fetchFn = getFetch();
    if (!backend || !backend.url || !fetchFn) {
      return cb(false);
    }

    var url = backend.url;
    var type = backend.type || 'firebase';
    var headers = Object.assign({ 'Content-Type': 'application/json' }, backend.headers || {});
    var payload = {
      n: wishData.n,
      w: wishData.w,
      t: typeof wishData.t === 'number' ? wishData.t : Date.now()
    };

    if (type === 'firebase') {
      url = url.replace(/\/?(\.json)?$/, '') + '.json';
    } else if (type === 'supabase') {
      if (backend.apiKey) {
        headers['apikey'] = backend.apiKey;
        headers['Authorization'] = 'Bearer ' + backend.apiKey;
      }
      headers['Prefer'] = 'return=minimal';
    }

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 6000) : 0;

    fetchFn(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    })
    .then(function (res) {
      if (timer) clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      cb(true);
    })
    .catch(function () {
      if (timer) clearTimeout(timer);
      cb(false); // Fail gracefully, fallback to local storage
    });
  }

  /* ---------- Offline Sync Queue (pip:pending_wishes) ---------- */
  var PENDING_KEY = 'pip:pending_wishes';

  function getStore(customStore) {
    if (customStore) return customStore;
    if (typeof window !== 'undefined' && window.PIP && window.PIP.store) return window.PIP.store;
    if (typeof global !== 'undefined' && global.PIP && global.PIP.store) return global.PIP.store;
    return {
      get: function (k, d) {
        try {
          if (typeof localStorage !== 'undefined') {
            var v = localStorage.getItem(k);
            if (v !== null) return v;
            if (k.indexOf('pip:') !== 0) {
              v = localStorage.getItem('pip:' + k);
              if (v !== null) return v;
            }
          }
        } catch (e) {}
        return d;
      },
      set: function (k, v) {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(k, v);
            if (k.indexOf('pip:') !== 0) localStorage.setItem('pip:' + k, v);
          }
        } catch (e) {}
      }
    };
  }

  function getPendingWishes(customStore) {
    var s = getStore(customStore);
    try {
      var raw = s.get('pending_wishes', null);
      if (raw === null || raw === undefined) {
        raw = s.get(PENDING_KEY, '[]');
      }
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function queuePendingWish(wishItem, customStore) {
    if (!wishItem || typeof wishItem.w !== 'string') return false;
    var cleanWish = sanitize(wishItem.w).slice(0, 120);
    if (!cleanWish) return false;
    var s = getStore(customStore);
    var queue = getPendingWishes(s);
    queue.push({
      n: sanitize(wishItem.n) || 'A sleepy visitor',
      w: cleanWish,
      t: typeof wishItem.t === 'number' ? wishItem.t : Date.now()
    });
    var data = JSON.stringify(queue);
    s.set(PENDING_KEY, data);
    s.set('pending_wishes', data);
    return true;
  }

  function clearPendingWishes(customStore) {
    var s = getStore(customStore);
    s.set(PENDING_KEY, '[]');
    s.set('pending_wishes', '[]');
  }

  var isSyncing = false;
  function syncPendingWishes(backend, cb, customStore) {
    if (isSyncing) {
      if (typeof cb === 'function') cb(0);
      return;
    }
    var s = getStore(customStore);
    var queue = getPendingWishes(s);
    if (!queue.length) {
      if (typeof cb === 'function') cb(0);
      return;
    }
    if (!backend || !backend.url) {
      if (typeof cb === 'function') cb(0);
      return;
    }

    isSyncing = true;
    var remaining = queue.slice();
    var syncedCount = 0;

    function finish(count) {
      isSyncing = false;
      if (typeof cb === 'function') cb(count);
    }

    function processNext() {
      if (!remaining.length) {
        clearPendingWishes(s);
        finish(syncedCount);
        return;
      }
      var item = remaining[0];
      postWish(backend, item, function (ok) {
        if (ok) {
          syncedCount++;
          remaining.shift();
          var data = JSON.stringify(remaining);
          s.set(PENDING_KEY, data);
          s.set('pending_wishes', data);
          processNext();
        } else {
          var data = JSON.stringify(remaining);
          s.set(PENDING_KEY, data);
          s.set('pending_wishes', data);
          finish(syncedCount);
        }
      });
    }

    processNext();
  }

  // Automatic offline-to-online sync event listener
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('online', function () {
      var p = (typeof window.PIP !== 'undefined') ? window.PIP : {};
      var backend = (p.fx && typeof p.fx.getBackendConfig === 'function')
        ? p.fx.getBackendConfig()
        : (typeof p.getBackendConfig === 'function' ? p.getBackendConfig() : null);
      if (backend) {
        syncPendingWishes(backend, function (count) {
          if (count > 0 && typeof p.toast === 'function') {
            p.toast('✨ Reconnected! Synced ' + count + ' offline wish' + (count > 1 ? 'es' : '') + ' to Midnight Wall.');
          }
        });
      }
    });
  }

  var wallModule = {
    sanitize: sanitize,
    validateWish: validateWish,
    checkRateLimit: checkRateLimit,
    parseRemotePayload: parseRemotePayload,
    fetchWishes: fetchWishes,
    postWish: postWish,
    PENDING_KEY: PENDING_KEY,
    getPendingWishes: getPendingWishes,
    queuePendingWish: queuePendingWish,
    clearPendingWishes: clearPendingWishes,
    syncPendingWishes: syncPendingWishes,
    COOLDOWN_MS: COOLDOWN_MS,
    WINDOW_MS: WINDOW_MS,
    MAX_PER_WINDOW: MAX_PER_WINDOW
  };

  if (typeof window !== 'undefined') {
    window.PIP = window.PIP || {};
    window.PIP.wall = wallModule;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = wallModule;
  }
})();
