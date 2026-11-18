/* fx.js: sparkle trail, confetti, dream odometer, wish wall. */
(function () {
  'use strict';
  var PIP = (typeof window !== 'undefined' && window.PIP) ? window.PIP : {};
  var $ = PIP.$ || function () { return null; };
  var $$ = PIP.$$ || function () { return []; };
  var store = PIP.store || { get: function () { return ''; }, set: function () {} };
  var toast = PIP.toast || function () {};
  var reduce = PIP.reduceMotion || { matches: false };

  /* ---------- sparkle trail (mouse and pen only, off for reduced motion) ---------- */
  var GLYPHS = ['✦', '★', '✧', '·'];
  var COLORS = ['#a34063', '#ffb454', '#8b8fd9', '#ff9fc0'];
  var live = 0, lastSpark = 0;
    function isQuiet() {
    return document.documentElement.getAttribute('data-quiet') === 'on';
  }

  function initSparkles() {
    document.addEventListener('pointermove', function (e) {
            if (reduce.matches || isQuiet() || e.pointerType === 'touch') return;
      var now = performance.now();
      if (now - lastSpark < 36 || live > 28) return;
      lastSpark = now;
      var s = document.createElement('span');
      s.className = 'sparkle';
      s.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      s.style.left = e.clientX + 'px';
      s.style.top = e.clientY + 'px';
      s.style.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      s.style.setProperty('--dx', (Math.random() * 30 - 15).toFixed(0) + 'px');
      s.style.setProperty('--dy', (14 + Math.random() * 22).toFixed(0) + 'px');
      s.style.fontSize = (10 + Math.random() * 12).toFixed(0) + 'px';
      live++;
      s.addEventListener('animationend', function () { s.remove(); live--; });
      document.body.appendChild(s);
    }, { passive: true });
  }

  /* ---------- confetti (own tiny canvas, no library) ---------- */
  var confettiRunning = false;
  function confetti(count) {
    var cv = $('#confetti');
        if (!cv || confettiRunning || reduce.matches || isQuiet()) return;
    var ctx = cv.getContext && cv.getContext('2d');
    if (!ctx) return;
    confettiRunning = true;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.display = 'block';
    var colors = ['#a34063', '#ffb454', '#fff1da', '#8b8fd9', '#ff9fc0', '#9ff0d0'];
    var n = count || 150, parts = [];
    for (var i = 0; i < n; i++) {
      parts.push({
        x: W / 2 + (Math.random() - 0.5) * 140, y: H * 0.45,
        vx: (Math.random() - 0.5) * 15, vy: -Math.random() * 14 - 4,
        w: 6 + Math.random() * 7, h: 8 + Math.random() * 8,
        r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3,
        c: colors[i % colors.length], star: Math.random() < 0.28
      });
    }
    var last = performance.now();
    (function frame(now) {
      var dt = Math.min((now - last) / 16.67, 2);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var alive = 0;
      parts.forEach(function (p) {
        p.vy += 0.34 * dt; p.vx *= 0.995;
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        if (p.y > H + 30) return;
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        if (p.star) { ctx.font = '16px serif'; ctx.fillText('✦', -6, 6); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (alive) window.requestAnimationFrame(frame);
      else { ctx.clearRect(0, 0, W, H); cv.style.display = 'none'; confettiRunning = false; }
    })(last);
  }

  /* ---------- dream odometer ---------- */
  function initOdometer() {
    var el = $('#odo');
    if (!el) return;
    var DIGITS = 6;
    var value = parseInt(store.get('dreams', '1204'), 10);
    if (!isFinite(value) || value < 1204) value = 1204;
    var cols = [];
    for (var i = 0; i < DIGITS; i++) {
      var d = document.createElement('span');
      d.className = 'odo-digit';
      var strip = document.createElement('span');
      strip.className = 'odo-strip';
      strip.innerHTML = '<b>0</b><b>1</b><b>2</b><b>3</b><b>4</b><b>5</b><b>6</b><b>7</b><b>8</b><b>9</b>';
      d.appendChild(strip);
      el.appendChild(d);
      cols.push(strip);
    }
    function render() {
      var s = String(value);
      while (s.length < DIGITS) s = '0' + s;
      cols.forEach(function (strip, idx) { strip.style.setProperty('--d', s.charAt(idx)); });
      el.setAttribute('aria-label', 'Dreams delivered tonight: ' + value);
    }
    render();
    var inView = true;
    var odoTimer = 0;
    function scheduleTick() {
      window.clearTimeout(odoTimer);
      if (document.hidden || !inView) {
        odoTimer = 0;
        return;
      }
      odoTimer = window.setTimeout(function () {
        if (inView && !document.hidden) {
          value += 1;
          store.set('dreams', value);
          render();
        }
        odoTimer = 0;
        scheduleTick();
      }, 5000 + Math.random() * 4000);
    }

    PIP.watchVisible(el, function (v) {
      inView = v;
      if (v && !document.hidden && !odoTimer) scheduleTick();
    });

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden && inView && !odoTimer) scheduleTick();
      });
    }

    scheduleTick();
  }

  /* ---------- real visitor counter (#118) ---------- */
  async function fetchRealVisitorCount() {
    try {
        const response = await fetch('https://api.countapi.xyz/hit/pipos-app/visits');
        if (!response.ok) throw new Error('Counter service unavailable');
        const data = await response.json();
        return data.value;
    } catch (error) {
        // Fail silently and avoid unhandled console errors as required
        console.debug('Real visitor counter skipped:', error.message);
        return null;
    }
  }

  async function initRealVisitorCounter() {
    const container = document.getElementById('real-visitor-counter');
    if (!container) return;

    const count = await fetchRealVisitorCount();
    if (count !== null) {
        container.textContent = `Real Visitors: ${count.toLocaleString()}`;
        container.style.display = 'block';
    } else {
        // Fail silently by hiding the element if the service is down
        container.style.display = 'none';
    }
  }

  /* ---------- wish wall (shared backend with local fallback) ---------- */
  var SEEDS = [
    { n: 'Boo-ton', w: 'Pip fixed my hiccups with one note.' },
    { n: 'Mrs. Hoot', w: 'The nightlight is still warm at 4am.' },
    { n: 'Wisp', w: 'I dreamt of soup. Thank you, Pip!' }
  ];
  var ROT = [-2.2, 1.6, -1, 2.4, -1.8, 0.8];

  function getBackendConfig() {
    if (typeof window !== 'undefined' && typeof window.PIP_WALL_BACKEND === 'object' && window.PIP_WALL_BACKEND !== null) {
      return window.PIP_WALL_BACKEND;
    }
    var meta = document.querySelector('meta[name="pip-wall-backend"]');
    if (meta && meta.content) {
      try {
        return JSON.parse(meta.content);
      } catch (e) {
        return { type: 'firebase', url: meta.content };
      }
    }
    return null;
  }

  function getStore() {
    if (typeof window !== 'undefined' && window.PIP && window.PIP.store) return window.PIP.store;
    if (typeof global !== 'undefined' && global.PIP && global.PIP.store) return global.PIP.store;
    return (PIP && PIP.store) ? PIP.store : store;
  }

  function loadLocalWishes() {
    try {
      var s = getStore();
      var a = JSON.parse(s.get('wall', '[]'));
      if (!Array.isArray(a)) return [];
      var valid = a.filter(function (x) { return x && typeof x.n === 'string' && typeof x.w === 'string'; });
      // Guarantee reverse chronological order (newest first).
      // If timestamps exist, sort descending so newest wishes stay at the top across reloads.
      var hasTimestamps = valid.some(function (x) { return typeof x.t === 'number'; });
      if (hasTimestamps) {
        valid.sort(function (x, y) { return (y.t || 0) - (x.t || 0); });
      }
      return valid.slice(0, 30);
    } catch (e) { return []; }
  }

  function saveLocalWish(item) {
    try {
      var current = loadLocalWishes();
      current.unshift(item);
      if (item && typeof item.t === 'number') {
        current.sort(function (x, y) { return (y.t || 0) - (x.t || 0); });
      }
      current = current.slice(0, 30);
      var s = getStore();
      s.set('wall', JSON.stringify(current));
    } catch (e) {}
  }

  function deleteLocalWish(idx) {
    try {
      var current = loadLocalWishes();
      if (typeof idx === 'number' && idx >= 0 && idx < current.length) {
        current.splice(idx, 1);
        var s = getStore();
        s.set('wall', JSON.stringify(current));
      }
      return current;
    } catch (e) { return []; }
  }

  function loadRateHistory() {
    try {
      var h = JSON.parse(store.get('wall_rate', '[]'));
      return Array.isArray(h) ? h : [];
    } catch (e) { return []; }
  }

  function saveRateHistory(h) {
    try {
      store.set('wall_rate', JSON.stringify(h.slice(-10)));
    } catch (e) {}
  }

  /* ---------- Starlight Reactions (pip:wish_reactions) ---------- */
  var REACTIONS_KEY = 'wish_reactions';

  function loadReactions() {
    try {
      var s = getStore();
      var raw = s.get(REACTIONS_KEY, null);
      if (raw === null || raw === undefined) {
        raw = s.get('pip:' + REACTIONS_KEY, '{}');
      }
      var parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveReactions(map) {
    try {
      var s = getStore();
      var data = JSON.stringify(map);
      s.set(REACTIONS_KEY, data);
      s.set('pip:' + REACTIONS_KEY, data);
    } catch (e) {}
  }

  function getWishReactionKey(item, index) {
    if (item && typeof item.t === 'number') return 'wish_' + item.t;
    if (item && typeof item.w === 'string') return 'wish_' + item.w.slice(0, 30).replace(/\s+/g, '_');
    return 'wish_' + (index || 0);
  }

  function getReactionCount(item, index) {
    var map = loadReactions();
    var key = getWishReactionKey(item, index);
    return (typeof map[key] === 'number') ? map[key] : 0;
  }

  function incrementReactionCount(item, index) {
    var map = loadReactions();
    var key = getWishReactionKey(item, index);
    var current = (typeof map[key] === 'number') ? map[key] : 0;
    var next = current + 1;
    map[key] = next;
    saveReactions(map);
    return next;
  }

  function formatWishesText(wishes) {
    var list = Array.isArray(wishes) ? wishes : [];
    var lines = [
      "Pip's Wish Wall — My Wishes",
      "===========================",
      ""
    ];
    if (list.length === 0) {
      lines.push("No wishes pinned yet.");
    } else {
      list.forEach(function (x, idx) {
        var name = (x && x.n) ? x.n : 'A sleepy visitor';
        var wish = (x && x.w) ? x.w : '';
        var dateStr = '';
        if (x && x.t) {
          try {
            dateStr = ' (pinned: ' + new Date(x.t).toISOString().replace('T', ' ').slice(0, 16) + ' UTC)';
          } catch (e) {}
        }
        lines.push((idx + 1) + '. "' + wish + '"');
        lines.push('   — ' + name + dateStr);
        lines.push('');
      });
    }
    lines.push('---------------------------');
    lines.push('Exported from pipOS • https://hax.baby');
    lines.push('');
    return lines.join('\n');
  }

  function exportWishes(wishes, filename, doc) {
    var text = formatWishesText(wishes);
    var d = doc || (typeof document !== 'undefined' ? document : null);
    var fname = filename || 'pip-wishes.txt';
    if (d && typeof d.createElement === 'function') {
      var blob = (typeof Blob !== 'undefined')
        ? new Blob([text], { type: 'text/plain;charset=utf-8' })
        : null;
      var url = (blob && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function')
        ? URL.createObjectURL(blob)
        : 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
      var a = d.createElement('a');
      a.href = url;
      a.download = fname;
      if (typeof a.setAttribute === 'function') a.setAttribute('download', fname);
      if (a.style) a.style.display = 'none';
      if (d.body && typeof d.body.appendChild === 'function') {
        d.body.appendChild(a);
        if (typeof a.click === 'function') a.click();
        setTimeout(function () {
          if (a.parentNode && typeof a.parentNode.removeChild === 'function') {
            a.parentNode.removeChild(a);
          }
          if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function' && typeof url === 'string' && url.indexOf('blob:') === 0) {
            URL.revokeObjectURL(url);
          }
        }, 200);
      }
    }
    return text;
  }

  // Create a note DOM element strictly using textContent to prevent HTML injection (XSS)
  function createNoteElement(x, i, doc, isOwn, onDelete) {
    var d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d || typeof d.createElement !== 'function') return null;
    var li = d.createElement('li');
    li.className = 'note n' + ((i || 0) % 4);
    if (li.style && typeof li.style.setProperty === 'function') {
      li.style.setProperty('--rot', ROT[(i || 0) % ROT.length] + 'deg');
    }
    var p = d.createElement('p');
    p.textContent = (x && typeof x.w === 'string') ? x.w : ''; // Strict textContent — prevents XSS
    var by = d.createElement('span');
    by.textContent = (x && typeof x.n === 'string') ? x.n : 'A sleepy visitor'; // Strict textContent — prevents XSS
    li.appendChild(p);
    li.appendChild(by);

    if (isOwn) {
      var reactBtn = d.createElement('button');
      reactBtn.type = 'button';
      reactBtn.className = 'note-react';
      var initialCount = getReactionCount(x, i);
      reactBtn.textContent = 'Send Starlight ✨' + (initialCount > 0 ? ' (' + initialCount + ')' : '');
      if (typeof reactBtn.setAttribute === 'function') {
        reactBtn.setAttribute('aria-label', 'Send Starlight ✨' + (initialCount > 0 ? ' (' + initialCount + ')' : ''));
        reactBtn.setAttribute('title', 'Send Starlight ✨');
      }

      if (typeof reactBtn.addEventListener === 'function') {
        reactBtn.addEventListener('click', function (e) {
          if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
          var newCount = incrementReactionCount(x, i);
          reactBtn.textContent = 'Send Starlight ✨ (' + newCount + ')';
          if (typeof reactBtn.setAttribute === 'function') {
            reactBtn.setAttribute('aria-label', 'Send Starlight ✨ (' + newCount + ')');
          }
          if (typeof window !== 'undefined' && window.PIP && window.PIP.fx && typeof window.PIP.fx.confetti === 'function') {
            window.PIP.fx.confetti(25);
          } else if (typeof global !== 'undefined' && global.PIP && global.PIP.fx && typeof global.PIP.fx.confetti === 'function') {
            global.PIP.fx.confetti(25);
          } else if (typeof confetti === 'function') {
            confetti(25);
          }
        });
      }

      var delBtn = d.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'note-del';
      if (typeof delBtn.setAttribute === 'function') {
        delBtn.setAttribute('aria-label', 'Delete wish from ' + (x.n || 'visitor'));
        delBtn.setAttribute('title', 'Delete wish');
      }
      delBtn.textContent = '✕';

      if (typeof delBtn.addEventListener === 'function') {
        delBtn.addEventListener('click', function (e) {
          if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
          if (typeof li.querySelector === 'function' && li.querySelector('.note-confirm')) return;

          var confirmBox = d.createElement('div');
          confirmBox.className = 'note-confirm';
          if (typeof confirmBox.setAttribute === 'function') {
            confirmBox.setAttribute('role', 'group');
            confirmBox.setAttribute('aria-label', 'Confirm wish deletion');
          }

          var confirmTxt = d.createElement('span');
          confirmTxt.className = 'note-confirm-txt';
          confirmTxt.textContent = 'Delete wish?';

          var btnRow = d.createElement('div');
          btnRow.className = 'note-confirm-btns';

          var yesBtn = d.createElement('button');
          yesBtn.type = 'button';
          yesBtn.className = 'btn-confirm-yes';
          yesBtn.textContent = 'Delete';
          if (typeof yesBtn.setAttribute === 'function') {
            yesBtn.setAttribute('aria-label', 'Confirm delete wish');
          }

          var noBtn = d.createElement('button');
          noBtn.type = 'button';
          noBtn.className = 'btn-confirm-no';
          noBtn.textContent = 'Cancel';
          if (typeof noBtn.setAttribute === 'function') {
            noBtn.setAttribute('aria-label', 'Cancel deletion');
          }

          btnRow.appendChild(yesBtn);
          btnRow.appendChild(noBtn);
          confirmBox.appendChild(confirmTxt);
          confirmBox.appendChild(btnRow);

          if (delBtn.style) delBtn.style.display = 'none';
          if (reactBtn.style) reactBtn.style.display = 'none';
          li.appendChild(confirmBox);

          if (typeof yesBtn.focus === 'function') {
            yesBtn.focus();
          }

          function dismiss() {
            if (confirmBox.parentNode && typeof confirmBox.parentNode.removeChild === 'function') {
              confirmBox.parentNode.removeChild(confirmBox);
            }
            if (delBtn.style) delBtn.style.display = '';
            if (reactBtn.style) reactBtn.style.display = '';
            if (typeof delBtn.focus === 'function') {
              delBtn.focus();
            }
          }

          noBtn.addEventListener('click', function (ev) {
            if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
            dismiss();
          });

          confirmBox.addEventListener('keydown', function (ev) {
            if (ev && ev.key === 'Escape') {
              if (typeof ev.stopPropagation === 'function') ev.stopPropagation();
              dismiss();
            }
          });

          yesBtn.addEventListener('click', function (ev) {
            if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
            if (typeof onDelete === 'function') {
              onDelete(x, i);
            }
          });
        });
      }

      li.appendChild(reactBtn);
      li.appendChild(delBtn);
    }

    return li;
  }

  function initWall() {
    var form = $('#gbForm'), list = $('#gbList');
    if (!form || !list) return;
    var wish = $('#gbWish'), name = $('#gbName'), count = $('#gbCount'), err = $('#gbError');
    var statusEl = $('#gbFine');
    var exportBtn = $('#gbExport');
    var wall = PIP.wall;
    var backend = getBackendConfig();

    var activeWishes = loadLocalWishes();
    var isConnected = false;

    function render() {
      list.textContent = '';
      var all = activeWishes.concat(SEEDS);
      all.forEach(function (x, i) {
        var isOwn = (i < activeWishes.length);
        var note = createNoteElement(x, i, document, isOwn, function (wishItem, wishIndex) {
          deleteWish(wishIndex);
        });
        if (note) list.appendChild(note);
      });
    }

    function deleteWish(idx) {
      if (typeof idx !== 'number' || idx < 0 || idx >= activeWishes.length) return;
      deleteLocalWish(idx);
      activeWishes = loadLocalWishes();
      render();
      toast('Wish deleted.');
      if (PIP.audio && typeof PIP.audio.isOn === 'function' && PIP.audio.isOn()) {
        PIP.audio.note(PIP.audio.SCALE[1], { dur: 0.3, gain: 0.1 });
      }
    }

    render();

    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        if (!activeWishes || activeWishes.length === 0) {
          toast('No personal wishes to export yet.');
          return;
        }
        exportWishes(activeWishes, 'pip-wishes.txt');
        toast('Wishes exported to pip-wishes.txt!');
      });
    }

    // If backend is configured, attempt retrieval
    if (backend && wall) {
      wall.fetchWishes(backend, function (remoteWishes) {
        if (remoteWishes && Array.isArray(remoteWishes)) {
          isConnected = true;
          activeWishes = remoteWishes;
          store.set('wall_remote_cache', JSON.stringify(remoteWishes));
          if (statusEl) statusEl.textContent = 'Shared wish wall • Synchronized live across dreamers.';
          render();
          if (typeof wall.syncPendingWishes === 'function') {
            wall.syncPendingWishes(backend, function (count) {
              if (count > 0 && typeof toast === 'function') {
                toast('✨ Synced ' + count + ' offline wish' + (count > 1 ? 'es' : '') + ' to Midnight Wall.');
              }
            });
          }
        } else {
          // Backend offline or unreachable: fall back to cached remote or local
          try {
            var cached = JSON.parse(store.get('wall_remote_cache', ''));
            if (Array.isArray(cached) && cached.length) activeWishes = cached;
          } catch (e) {}
          if (statusEl) statusEl.textContent = 'Wishes are saved on this device only (offline mode).';
          render();
        }
      });
    } else {
      if (statusEl) statusEl.textContent = 'Wishes are saved on this device only.';
    }

    wish.addEventListener('input', function () {
      count.textContent = wish.value.length + ' / 120';
      count.setAttribute('aria-label', 'Character count: ' + wish.value.length + ' of 120');
      if (err.textContent) {
        err.textContent = '';
        wish.removeAttribute('aria-invalid');
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Input length validation & sanitization
      var validation = wall
        ? wall.validateWish(wish.value, name.value)
        : { ok: !!wish.value.trim(), wish: wish.value.trim().slice(0, 120), name: name.value.trim().slice(0, 20) || 'A sleepy visitor' };

      if (!validation.ok) {
        err.textContent = validation.error || 'Write a wish first. Even a tiny one counts.';
        wish.setAttribute('aria-invalid', 'true');
        wish.focus();
        return;
      }

      // Rate limiting
      var history = loadRateHistory();
      if (wall) {
        var check = wall.checkRateLimit(history);
        if (!check.allowed) {
          err.textContent = check.error;
          wish.setAttribute('aria-invalid', 'true');
          wish.focus();
          return;
        }
        history = check.history;
      }

      // Passed validation and rate limit
      history.push(Date.now());
      saveRateHistory(history);

      var newWish = { n: validation.name, w: validation.wish, t: Date.now() };
      if (name.value.trim()) store.set('visitor', validation.name);
      if (PIP.stickers) PIP.stickers.unlock('wish');

      wish.value = '';
      count.textContent = '0 / 120';
      count.setAttribute('aria-label', 'Character count: 0 of 120');
      err.textContent = '';

      // Optimistic or confirmed update
      if (backend && isConnected && wall) {
        wall.postWish(backend, newWish, function (success) {
          saveLocalWish(newWish);
          activeWishes = loadLocalWishes();
          render();
          if (success) {
            toast('Pinned to the wall. Pip yawns happily.');
          } else {
            if (typeof wall.queuePendingWish === 'function') {
              wall.queuePendingWish(newWish);
            }
            toast('Pinned to your local wall (queued for sync).');
          }
        });
      } else {
        // Local mode or fallback
        if (backend && wall && typeof wall.queuePendingWish === 'function') {
          wall.queuePendingWish(newWish);
        }
        saveLocalWish(newWish);
        activeWishes = loadLocalWishes();
        render();
        toast(backend ? 'Pinned to your local wall (queued for sync).' : 'Pinned to the wall. Pip yawns happily.');
      }

      if (PIP.audio && typeof PIP.audio.isOn === 'function' && PIP.audio.isOn()) {
        PIP.audio.note(PIP.audio.SCALE[4], { dur: 0.9, gain: 0.15 });
        PIP.audio.note(PIP.audio.SCALE[6], { dur: 1.1, gain: 0.13, when: 0.1 });
      }
    });
  }

  PIP.fx = {
    confetti: confetti,
    createNoteElement: createNoteElement,
    formatWishesText: formatWishesText,
    exportWishes: exportWishes,
    loadLocalWishes: loadLocalWishes,
    saveLocalWish: saveLocalWish,
    deleteLocalWish: deleteLocalWish,
    getBackendConfig: getBackendConfig,
    getReactionCount: getReactionCount,
    incrementReactionCount: incrementReactionCount,
    init: function () { initSparkles(); initOdometer(); initWall(); initRealVisitorCounter();}
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      createNoteElement: createNoteElement,
      formatWishesText: formatWishesText,
      exportWishes: exportWishes,
      loadLocalWishes: loadLocalWishes,
      saveLocalWish: saveLocalWish,
      deleteLocalWish: deleteLocalWish,
      getBackendConfig: getBackendConfig,
      getReactionCount: getReactionCount,
      incrementReactionCount: incrementReactionCount,
      ROT: ROT,
      SEEDS: SEEDS
    };
  }
})();
