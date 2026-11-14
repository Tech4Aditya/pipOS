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

  // Fetch remote wishes with timeout and safe fallback
  function fetchWishes(backend, cb) {
    if (!backend || !backend.url || typeof window === 'undefined' || !window.fetch) {
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

    fetch(url, {
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
    if (!backend || !backend.url || typeof window === 'undefined' || !window.fetch) {
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

    fetch(url, {
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

  var wallModule = {
    sanitize: sanitize,
    validateWish: validateWish,
    checkRateLimit: checkRateLimit,
    parseRemotePayload: parseRemotePayload,
    fetchWishes: fetchWishes,
    postWish: postWish,
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
