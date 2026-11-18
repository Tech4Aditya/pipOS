/* toys.js: Lullaby Lab, Nightlight Collection, Rattle & Blocks, Dream Delivery. */
(function () {
  'use strict';
  var PIP = (typeof window !== 'undefined' && window.PIP) ? window.PIP : {};
  var $ = PIP.$ || function () { return null; };
  var $$ = PIP.$$ || function () { return []; };
  var store = PIP.store || { get: function () { return ''; }, set: function () {} };
  var clamp = PIP.clamp || function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var toast = PIP.toast || function () {};
  var reduce = PIP.reduceMotion || { matches: false };
  var audio = PIP.audio || { isOn: function () { return false; }, note: function () {} };

  /* =====================================================================
     1. LULLABY LAB
     ===================================================================== */
  function initLab() {
    var keysEl = $('#keys'), stage = $('#mbStage'), wind = $('#windBtn'), endless = $('#endlessBtn');
    if (!keysEl || !stage || !wind || !endless) return;

    var NAMES = ['C', 'D', 'E', 'G', 'A', 'high C', 'high D', 'high E'];
    var PAL = ['#ff9fb4', '#ffd27a', '#9fd8c4', '#9ab8f0', '#d3a8f2', '#ffb08a', '#8fd3e8', '#c7e58a'];
    var buttons = [];
    var labVisible = false;

    NAMES.forEach(function (n, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'key';
      b.setAttribute('data-silent', '');
      b.setAttribute('aria-label', 'Note ' + n + ', key ' + (i + 1));
      b.style.setProperty('--k', PAL[i]);
      b.innerHTML = '<span aria-hidden="true">' + (i + 1) + '</span>';
      b.addEventListener('click', function () { press(i); });
      keysEl.appendChild(b);
      buttons.push(b);
    });

    function flash(i) {
      var b = buttons[i];
      b.classList.add('is-down');
      window.setTimeout(function () { b.classList.remove('is-down'); }, 180);
      if (reduce.matches) return;
      var f = document.createElement('span');
      f.className = 'float';
      f.textContent = '✦';
      f.style.left = ((i + 0.5) / 8 * 100) + '%';
      f.style.color = PAL[i];
      f.addEventListener('animationend', function () { f.remove(); });
      stage.appendChild(f);
    }

    function press(i) {
      flash(i);
      if (audio.request()) {
        audio.note(audio.SCALE[i], {
          dur: 1.6,
          gain: 0.24,
          adsr: { a: 0.005, d: 0.15, s: 0.25, r: 0.9 },
          bell: true
        });
      }
    }

    // number keys 1-8 while the lab is on screen (and you're not typing)
    document.addEventListener('keydown', function (e) {
      if (!labVisible || e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= 8) press(n - 1);
    });
    PIP.watchVisible($('#lab'), function (v) { labVisible = v; }, '0px');

    // original pentatonic melodies; -1 is a rest
    var TUNES = [
      {
        name: 'The Nursery Step',
        notes: [0, 2, 4, 2, 3, 1, 0, -1, 2, 4, 5, 4, 3, 2, 1, -1, 4, 5, 7, 5, 4, 2, 3, 1, 0, -1, -1, -1],
        tempo: 430
      },
      {
        name: 'Cloud Patrol',
        notes: [0, 1, 2, 4, 3, 2, 1, -1, 2, 3, 5, 4, 3, 2, 0, -1, 4, 6, 7, 6, 5, 3, 4, 2, 0, -1, -1, -1],
        tempo: 410
      },
      {
        name: 'Starlight Waltz',
        notes: [4, 2, 0, 2, 4, 5, 4, -1, 5, 4, 2, 4, 5, 7, 6, -1, 7, 5, 4, 3, 2, 1, 0, 2, 0, -1, -1, -1],
        tempo: 460
      }
    ];
    var currentTuneIdx = parseInt(store.get('tune_idx', '0'), 10) || 0;
    if (currentTuneIdx < 0 || currentTuneIdx >= TUNES.length) currentTuneIdx = 0;

    var volSlider = $('#volSlider'), volValue = $('#volValue'), tuneSelect = $('#tuneSelect');

    if (volSlider && audio.getVolume) {
      volSlider.value = audio.getVolume();
      if (volValue) volValue.textContent = Math.round(audio.getVolume() * 100) + '%';
      volSlider.addEventListener('input', function () {
        var val = parseFloat(volSlider.value);
        if (audio.setVolume) audio.setVolume(val);
        if (volValue) volValue.textContent = Math.round(val * 100) + '%';
        volSlider.setAttribute('aria-valuenow', Math.round(val * 100));
        volSlider.setAttribute('aria-valuetext', Math.round(val * 100) + ' percent volume');
      });
    }

    if (tuneSelect) {
      tuneSelect.value = String(currentTuneIdx);
      tuneSelect.addEventListener('change', function () {
        currentTuneIdx = parseInt(tuneSelect.value, 10);
        store.set('tune_idx', currentTuneIdx);
        if (playing) {
          stopTune();
          playTune();
        }
      });
    }

    var playing = false, timers = [];

    function stopTune() {
      timers.forEach(window.clearTimeout);
      timers = [];
      playing = false;
      wind.textContent = 'Wind the box';
      wind.setAttribute('aria-pressed', 'false');
    }
    function playTune() {
      if (!audio.request()) return;
      if (audio.isEndless()) stopEndlessUi();
      playing = true;
      wind.textContent = 'Stop the box';
      wind.setAttribute('aria-pressed', 'true');
      var curTune = TUNES[currentTuneIdx] || TUNES[0];
      curTune.notes.forEach(function (n, step) {
        timers.push(window.setTimeout(function () {
          if (n >= 0) press(n);
          if (step === curTune.notes.length - 1) stopTune();
        }, step * curTune.tempo));
      });
    }
    wind.addEventListener('click', function () { if (playing) stopTune(); else playTune(); });

    function stopEndlessUi() {
      audio.stopEndless();
      endless.textContent = 'Endless lullaby';
      endless.setAttribute('aria-pressed', 'false');
      endless.classList.remove('is-on');
    }
    endless.addEventListener('click', function () {
      if (audio.isEndless()) { stopEndlessUi(); return; }
      if (!audio.request()) return;
      if (playing) stopTune();
      audio.startEndless(flash);
      endless.textContent = 'Stop lullaby';
      endless.setAttribute('aria-pressed', 'true');
      endless.classList.add('is-on');
    });

    var rainBtn = $('#ambientRainBtn'), cricketsBtn = $('#ambientCricketsBtn'), windBtn = $('#ambientWindBtn');
    var ambSlider = $('#ambientSlider'), ambValue = $('#ambientValue');

    if (rainBtn) {
      rainBtn.addEventListener('click', function () {
        if (audio.isRainActive && audio.isRainActive()) {
          audio.stopRain();
          rainBtn.setAttribute('aria-pressed', 'false');
          rainBtn.classList.remove('is-on');
        } else {
          if (!audio.request()) return;
          audio.startRain();
          rainBtn.setAttribute('aria-pressed', 'true');
          rainBtn.classList.add('is-on');
        }
      });
    }

    if (cricketsBtn) {
      cricketsBtn.addEventListener('click', function () {
        if (audio.isCricketsActive && audio.isCricketsActive()) {
          audio.stopCrickets();
          cricketsBtn.setAttribute('aria-pressed', 'false');
          cricketsBtn.classList.remove('is-on');
        } else {
          if (!audio.request()) return;
          audio.startCrickets();
          cricketsBtn.setAttribute('aria-pressed', 'true');
          cricketsBtn.classList.add('is-on');
        }
      });
    }

    if (windBtn) {
      windBtn.addEventListener('click', function () {
        if (audio.isWindActive && audio.isWindActive()) {
          audio.stopWind();
          windBtn.setAttribute('aria-pressed', 'false');
          windBtn.classList.remove('is-on');
        } else {
          if (!audio.request()) return;
          audio.startWind();
          windBtn.setAttribute('aria-pressed', 'true');
          windBtn.classList.add('is-on');
        }
      });
    }

    if (ambSlider && audio.getAmbientLevel) {
      var initialAmb = audio.getAmbientLevel();
      ambSlider.value = initialAmb;
      if (ambValue) ambValue.textContent = Math.round(initialAmb * 100) + '%';
      ambSlider.addEventListener('input', function () {
        var v = parseFloat(ambSlider.value);
        if (audio.setAmbientLevel) audio.setAmbientLevel(v);
        var pct = Math.round(v * 100);
        if (ambValue) ambValue.textContent = pct + '%';
        ambSlider.setAttribute('aria-valuenow', pct);
        ambSlider.setAttribute('aria-valuetext', pct + ' percent ambient volume');
      });
    }

    // muting from the taskbar stops everything the lab is doing
    audio.onChange(function (s) {
      if (s !== 'on') {
        stopTune();
        stopEndlessUi();
        if (rainBtn) { rainBtn.setAttribute('aria-pressed', 'false'); rainBtn.classList.remove('is-on'); }
        if (cricketsBtn) { cricketsBtn.setAttribute('aria-pressed', 'false'); cricketsBtn.classList.remove('is-on'); }
        if (windBtn) { windBtn.setAttribute('aria-pressed', 'false'); windBtn.classList.remove('is-on'); }
      }
    });
  }

  /* =====================================================================
     2. NIGHTLIGHT COLLECTION (flashlight dark room)
     ===================================================================== */
  function initLights() {
    var room = $('#darkroom'), lanternsEl = $('#lanterns'), trayN = $('#trayN');
    var roomsEl = $('#drRooms'), resetBtn = $('#drResetRoom');
    if (!room || !lanternsEl) return;

    var ROOMS = [
      { id: 'nursery', name: 'Nursery', hint: 'Dark nursery. Move your pointer, drag the lantern, or use arrow keys to shine the light.' },
      { id: 'attic', name: 'Attic', hint: 'Dusty attic. Move your pointer, drag the lantern, or use arrow keys to shine the light.' },
      { id: 'garden', name: 'Garden', hint: 'Night garden. Move your pointer, drag the lantern, or use arrow keys to shine the light.' }
    ];

    var curRoom = store.get('dr_room', 'nursery');
    if (curRoom !== 'nursery' && curRoom !== 'attic' && curRoom !== 'garden') {
      curRoom = 'nursery';
    }

    var foundByRoom = { nursery: [], attic: [], garden: [] };
    try {
      var rawFound = store.get('dr_found', '');
      if (rawFound) {
        var parsed = JSON.parse(rawFound);
        if (parsed && typeof parsed === 'object') {
          ['nursery', 'attic', 'garden'].forEach(function (k) {
            if (Array.isArray(parsed[k])) foundByRoom[k] = parsed[k];
          });
        }
      }
    } catch (e) {}

    // Fallbacks for individual room store keys if dr_found was empty
    ['nursery', 'attic', 'garden'].forEach(function (k) {
      if (!foundByRoom[k].length) {
        var ind = store.get('dr_found_' + k, '');
        if (ind) {
          try {
            var arr = JSON.parse(ind);
            if (Array.isArray(arr)) foundByRoom[k] = arr;
          } catch (e) {}
        }
      }
    });

    function saveProgress() {
      store.set('dr_found', JSON.stringify(foundByRoom));
      var counts = {
        nursery: foundByRoom.nursery.length,
        attic: foundByRoom.attic.length,
        garden: foundByRoom.garden.length
      };
      var total = counts.nursery + counts.attic + counts.garden;
      store.set('dr_counts', JSON.stringify(counts));
      store.set('dr_count_nursery', counts.nursery);
      store.set('dr_count_attic', counts.attic);
      store.set('dr_count_garden', counts.garden);
      store.set('dr_total_found', total);
      store.set('dr_room', curRoom);
      store.set('nightlight_found', total);
      store.set('nightlight_counts', JSON.stringify(counts));
    }

    function syncRoomElements() {
      ['nursery', 'attic', 'garden'].forEach(function (rk) {
        var rEl = $('.dr-room[data-room="' + rk + '"]', room);
        if (!rEl) return;
        var rItems = $$('[data-item]', rEl);
        var foundList = foundByRoom[rk] || [];
        rItems.forEach(function (it) {
          var name = it.getAttribute('data-name');
          if (name && foundList.indexOf(name) !== -1) {
            it.classList.add('is-found');
          } else {
            it.classList.remove('is-found');
          }
        });
        var badge = $('#roomCount' + rk.charAt(0).toUpperCase() + rk.slice(1));
        if (badge) {
          badge.textContent = foundList.length + '/' + rItems.length;
        }
      });
    }

    function updateRoomView() {
      room.setAttribute('data-current-room', curRoom);
      var roomConf = ROOMS.filter(function (r) { return r.id === curRoom; })[0] || ROOMS[0];
      room.setAttribute('aria-label', roomConf.hint);

      if (roomsEl) {
        var roomBtns = $$('.dr-room-btn', roomsEl);
        roomBtns.forEach(function (btn) {
          var rk = btn.getAttribute('data-room');
          var isActive = (rk === curRoom);
          btn.classList.toggle('is-active', isActive);
          btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
          btn.tabIndex = isActive ? 0 : -1;
        });
      }

      var roomSections = $$('.dr-room', room);
      roomSections.forEach(function (sec) {
        var rk = sec.getAttribute('data-room');
        var isActive = (rk === curRoom);
        sec.classList.toggle('is-active', isActive);
        if (isActive) {
          sec.removeAttribute('hidden');
        } else {
          sec.setAttribute('hidden', '');
        }
      });

      var activeEl = $('.dr-room[data-room="' + curRoom + '"]', room);
      var activeItems = activeEl ? $$('[data-item]', activeEl) : [];
      var curFound = (foundByRoom[curRoom] || []).length;
      var total = activeItems.length || 5;

      if (trayN) {
        trayN.textContent = curFound + ' of ' + total + ' dreams found';
      }
      room.classList.toggle('is-done', curFound >= total && total > 0);
    }

    function setRoom(rk) {
      if (rk !== 'nursery' && rk !== 'attic' && rk !== 'garden') return;
      curRoom = rk;
      store.set('dr_room', curRoom);
      updateRoomView();
    }

    if (roomsEl) {
      var roomBtns = $$('.dr-room-btn', roomsEl);
      roomBtns.forEach(function (btn, idx) {
        btn.addEventListener('click', function () {
          var rk = btn.getAttribute('data-room');
          setRoom(rk);
          btn.focus();
        });
        btn.addEventListener('keydown', function (e) {
          var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1
                : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
          if (d !== 0) {
            e.preventDefault();
            var nextIdx = (idx + d + roomBtns.length) % roomBtns.length;
            var nextBtn = roomBtns[nextIdx];
            var nextRk = nextBtn.getAttribute('data-room');
            setRoom(nextRk);
            nextBtn.focus();
          } else if (e.key === 'Home') {
            e.preventDefault();
            setRoom(roomBtns[0].getAttribute('data-room'));
            roomBtns[0].focus();
          } else if (e.key === 'End') {
            e.preventDefault();
            setRoom(roomBtns[roomBtns.length - 1].getAttribute('data-room'));
            roomBtns[roomBtns.length - 1].focus();
          }
        });
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        foundByRoom[curRoom] = [];
        var activeEl = $('.dr-room[data-room="' + curRoom + '"]', room);
        if (activeEl) {
          $$('[data-item]', activeEl).forEach(function (it) {
            it.classList.remove('is-found');
          });
        }
        saveProgress();
        syncRoomElements();
        updateRoomView();
        var curName = curRoom.charAt(0).toUpperCase() + curRoom.slice(1);
        toast('Dreams hidden again in the ' + curName + '.');
      });
    }

    var LANTERNS = [
      { name: 'Moon', glow: '#cfe3ff', r: 92 },
      { name: 'Honey', glow: '#ffc866', r: 112 },
      { name: 'Rose', glow: '#ff9fc0', r: 80 },
      { name: 'Mint', glow: '#9ff0d0', r: 100 }
    ];
    var cur = 0, x = 0, y = 0, r = LANTERNS[0].r;
    var lastMove = 0, visible = false;

    function paint() {
      room.style.setProperty('--x', x.toFixed(0) + 'px');
      room.style.setProperty('--y', y.toFixed(0) + 'px');
    }
    function setLantern(i) {
      cur = i;
      r = LANTERNS[i].r;
      room.style.setProperty('--r', r + 'px');
      room.style.setProperty('--glow', LANTERNS[i].glow);
      $$('.lantern', lanternsEl).forEach(function (b, j) {
        b.setAttribute('aria-checked', j === i ? 'true' : 'false');
        b.tabIndex = j === i ? 0 : -1;
      });
    }
    LANTERNS.forEach(function (l, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lantern';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', i === 0 ? 'true' : 'false');
      b.setAttribute('aria-label', l.name + ' lantern');
      b.tabIndex = i === 0 ? 0 : -1;
      b.style.setProperty('--c', l.glow);
      b.innerHTML = '<i aria-hidden="true"></i><span>' + l.name + '</span>';
      b.addEventListener('click', function () { setLantern(i); b.focus(); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        var radios = $$('.lantern', lanternsEl);
        if (d !== 0) {
          e.preventDefault();
          var n = (cur + d + LANTERNS.length) % LANTERNS.length;
          setLantern(n);
          radios[n].focus();
        } else if (e.key === 'Home') {
          e.preventDefault();
          setLantern(0);
          radios[0].focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          setLantern(LANTERNS.length - 1);
          radios[LANTERNS.length - 1].focus();
        }
      });
      lanternsEl.appendChild(b);
    });

    function center() {
      var b = room.getBoundingClientRect();
      x = b.width / 2;
      y = b.height / 2;
    }
    function toLocal(e) {
      var b = room.getBoundingClientRect();
      x = clamp(e.clientX - b.left, 0, b.width);
      y = clamp(e.clientY - b.top, 0, b.height);
      lastMove = performance.now();
      paint();
    }
    var handle = $('#drHandle');
    var isDraggingHandle = false;

    if (handle) {
      handle.addEventListener('pointerdown', function (e) {
        isDraggingHandle = true;
        handle.classList.add('is-dragging');
        if (handle.setPointerCapture) {
          try { handle.setPointerCapture(e.pointerId); } catch (err) {}
        }
        toLocal(e);
        tryFind();
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
      });

      handle.addEventListener('pointermove', function (e) {
        if (!isDraggingHandle) return;
        toLocal(e);
        tryFind();
        if (e.cancelable) e.preventDefault();
      });

      function endHandleDrag(e) {
        if (!isDraggingHandle) return;
        isDraggingHandle = false;
        handle.classList.remove('is-dragging');
        if (handle.releasePointerCapture && e.pointerId) {
          try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
        }
      }

      handle.addEventListener('pointerup', endHandleDrag);
      handle.addEventListener('pointercancel', endHandleDrag);
    }

    var roomTouchStart = null;

    room.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') {
        toLocal(e);
        tryFind();
        return;
      }
      roomTouchStart = { x: e.clientX, y: e.clientY, time: performance.now() };
    });

    room.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'mouse') {
        toLocal(e);
      }
    });

    room.addEventListener('pointerup', function (e) {
      if (e.pointerType !== 'mouse' && roomTouchStart) {
        var dx = Math.abs(e.clientX - roomTouchStart.x);
        var dy = Math.abs(e.clientY - roomTouchStart.y);
        var dt = performance.now() - roomTouchStart.time;
        if (dx < 12 && dy < 12 && dt < 400) {
          toLocal(e);
          tryFind();
        }
        roomTouchStart = null;
      }
    });

    room.addEventListener('pointercancel', function () {
      roomTouchStart = null;
    });
    room.addEventListener('keydown', function (e) {
      var b = room.getBoundingClientRect(), step = 28;
      if (e.key === 'ArrowLeft') x = clamp(x - step, 0, b.width);
      else if (e.key === 'ArrowRight') x = clamp(x + step, 0, b.width);
      else if (e.key === 'ArrowUp') y = clamp(y - step, 0, b.height);
      else if (e.key === 'ArrowDown') y = clamp(y + step, 0, b.height);
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tryFind(); return; }
      else return;
      e.preventDefault();
      lastMove = performance.now();
      paint();
      tryFind();
    });

    // a dream is found when the lit circle covers it and you click, tap or press Enter
    function tryFind() {
      var rb = room.getBoundingClientRect();
      var activeEl = $('.dr-room[data-room="' + curRoom + '"]', room);
      if (!activeEl) return;
      var activeItems = $$('[data-item]', activeEl);

      activeItems.forEach(function (it) {
        if (it.classList.contains('is-found')) return;
        var ib = it.getBoundingClientRect();
        var ix = ib.left + ib.width / 2 - rb.left, iy = ib.top + ib.height / 2 - rb.top;
        if (Math.hypot(ix - x, iy - y) < Math.max(34, r * 0.55)) {
          it.classList.add('is-found');
          var itName = it.getAttribute('data-name') || it.getAttribute('data-item') || 'dream';
          if (foundByRoom[curRoom].indexOf(itName) === -1) {
            foundByRoom[curRoom].push(itName);
          }
          var curCount = foundByRoom[curRoom].length;
          var totalInRoom = activeItems.length || 5;

          saveProgress();
          syncRoomElements();

          if (trayN) {
            trayN.textContent = curCount + ' of ' + totalInRoom + ' dreams found' + (itName ? ' (' + itName + ')' : '');
          }
          if (audio.isOn()) audio.note(audio.SCALE[Math.min(curCount + 2, 7)], { dur: 1.2, gain: 0.18 });

          if (curCount === totalInRoom) {
            var curName = curRoom.charAt(0).toUpperCase() + curRoom.slice(1);
            toast('All five dreams found in the ' + curName + '! Pip is very proud.');
            room.classList.add('is-done');
            if (audio.isOn()) audio.giggle();
            if (PIP.stickers) PIP.stickers.unlock('dreams5');
          }
        }
      });
    }

    // when you aren't pointing, the lantern drifts on its own
    var t0 = performance.now(), raf = 0;
    function drift(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      if (now - lastMove > 2500 && !reduce.matches) {
        var b = room.getBoundingClientRect(), t = (now - t0) / 1000;
        x = b.width * (0.5 + 0.36 * Math.sin(t * 0.55));
        y = b.height * (0.5 + 0.32 * Math.sin(t * 0.83 + 1));
        paint();
      }
      raf = window.requestAnimationFrame(drift);
    }
    PIP.watchVisible(room, function (v) {
      visible = v;
      if (v && !document.hidden && !raf) raf = window.requestAnimationFrame(drift);
    });

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden && visible && !raf) {
          raf = window.requestAnimationFrame(drift);
        }
      });
    }

    window.addEventListener('resize', function () { if (performance.now() - lastMove > 2500) { center(); paint(); } });
    syncRoomElements();
    updateRoomView();
    setLantern(0);
    center();
    paint();
  }

  /* =====================================================================
     3. RATTLE & BLOCKS (stacker)
     ===================================================================== */
  var blocksRenderLeaderboard = null;
  var blocksSyncBest = null;

  function initBlocks() {
    var cv = $('#blockCanvas'), btn = $('#blockDrop'), scoreEl = $('#blockScore');
    var leaderboardListEl = $('#blockLeaderboardList'), comboEl = $('#blockCombo');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d');
    if (!ctx) return;

    var W = 300, H = 420, BH = 28;
    var PAL = ['#ff9fb4', '#ffd27a', '#9fd8c4', '#9ab8f0', '#d3a8f2', '#ffb08a'];
    var LET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
   var dpr = Math.min((window.devicePixelRatio || 1) * 1.15, 3);
    cv.width = W * dpr;
    cv.height = H * dpr;

    var st, raf = 0, visible = false, last = 0;
       var THEMES = {
      candy: { pal: PAL, line: '#5c4033', bg: null, floor: 'rgba(92,64,51,.18)', dark: false },
      midnight: { pal: ['#7c6cff', '#3ec9ff', '#ff5fc8', '#4dffb0', '#ffd35c', '#ff7a5c'], line: '#140e24', bg: '#1b1430', floor: 'rgba(255,255,255,.14)', dark: true }
    };
    var MODES = {
      easy: { start: 200, base: 90, step: 5, max: 240, hint: 'Easy: wide first block, slow and gentle.' },
      normal: { start: 160, base: 120, step: 8, max: 340, hint: 'Normal: the classic stack.' },
      hard: { start: 110, base: 160, step: 12, max: 430, hint: 'Hard: narrow first block, fast and getting faster.' }
    };
    function valid(map, key, fallback) { return map.hasOwnProperty(key) ? key : fallback; }
    var modeKey = valid(MODES, store.get('blockMode', 'normal'), 'normal');
    var themeKey = valid(THEMES, store.get('blockTheme', 'candy'), 'candy');
    var mode = MODES[modeKey], theme = THEMES[themeKey];
    function bestKey() { return modeKey === 'normal' ? 'best' : 'best-' + modeKey; }
    var best = parseInt(store.get(bestKey(), '0'), 10) || 0;

    function getTopScores() {
      try {
        var raw = store.get('blockTopScores', '[]');
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(function (s) { return typeof s === 'number' && !isNaN(s) && s > 0; })
                       .sort(function (a, b) { return b - a; })
                       .slice(0, 5);
        }
      } catch (e) { /* ignore parse error */ }
      return [];
    }

    function saveTopScore(score) {
      if (!score || score <= 0) return;
      var scores = getTopScores();
      scores.push(score);
      scores.sort(function (a, b) { return b - a; });
      scores = scores.slice(0, 5);
      store.set('blockTopScores', JSON.stringify(scores));
      renderLeaderboard(scores);
    }

    function renderLeaderboard(scores) {
      if (!leaderboardListEl) return;
      var list = scores || getTopScores();
      leaderboardListEl.innerHTML = '';
      if (!list.length) {
        var emptyLi = document.createElement('li');
        emptyLi.className = 'block-leaderboard-empty';
        emptyLi.textContent = 'No scores yet \u2014 start stacking!';
        leaderboardListEl.appendChild(emptyLi);
        return;
      }
      list.forEach(function (val, idx) {
        var li = document.createElement('li');
        li.textContent = '#' + (idx + 1) + ' \u2014 ' + val + ' pts';
        leaderboardListEl.appendChild(li);
      });
    }

    var modeBtns = $$('[data-block-mode]'), themeBtns = $$('[data-block-theme]'), hintEl = $('#blockModeHint');
    function syncUI() {
      modeBtns.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-block-mode') === modeKey));
      });
      themeBtns.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-block-theme') === themeKey));
      });
      if (hintEl) hintEl.textContent = mode.hint;
    }
    modeBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-block-mode');
        if (!MODES.hasOwnProperty(k) || k === modeKey) return;
        modeKey = k;
        mode = MODES[k];
        store.set('blockMode', k);
        best = parseInt(store.get(bestKey(), '0'), 10) || 0;
        syncUI();
        reset();
      });
    });
    themeBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-block-theme');
        if (!THEMES.hasOwnProperty(k) || k === themeKey) return;
        themeKey = k;
        theme = THEMES[k];
        store.set('blockTheme', k);
        syncUI();
      });
    });
    syncUI();
    renderLeaderboard();
    blocksRenderLeaderboard = renderLeaderboard;
    blocksSyncBest = function (newBest) {
      if (newBest > best) {
        best = newBest;
        hud();
      }
    };

    function rr(x, y, w, h, rad) {
      rad = Math.min(rad, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.arcTo(x + w, y, x + w, y + h, rad);
      ctx.arcTo(x + w, y + h, x, y + h, rad);
      ctx.arcTo(x, y + h, x, y, rad);
      ctx.arcTo(x, y, x + w, y, rad);
      ctx.closePath();
    }
    function levelY(i) { return H - 10 - (i + 1) * BH; } // world y of block i's top

    function reset() {
      st = { stack: [{ x: (W - mode.start) / 2, w: mode.start, i: 0 }], cur: null, chips: [], score: 0, combo: 0, over: false, cam: 0 };
      if (comboEl) {
        comboEl.hidden = true;
        comboEl.textContent = '';
      }
      spawn();
      hud();
      if (!raf && visible) loop();
    }
    function spawn() {
      var top = st.stack[st.stack.length - 1];
      var dir = st.stack.length % 2 ? 1 : -1;
      st.cur = { x: dir > 0 ? 0 : W - top.w, w: top.w, dir: dir, i: st.stack.length };
    }
    function hud() {
      var txt = 'Height ' + st.score + ', best ' + best;
      if (st.combo > 1) {
        txt += ' (Combo x' + st.combo + '!)';
      }
      scoreEl.textContent = txt;
    }

    function drop() {
      if (st.over) { reset(); return; }
      var top = st.stack[st.stack.length - 1], c = st.cur;
      var left = Math.max(c.x, top.x), right = Math.min(c.x + c.w, top.x + top.w), ov = right - left;
      if (ov < 3) {
        st.chips.push({ x: c.x, w: c.w, y: levelY(c.i), vy: 0, i: c.i });
        st.cur = null;
        st.over = true;
        saveTopScore(st.score);
        st.combo = 0;
        if (comboEl) comboEl.hidden = true;
        if (st.score > best) { best = st.score; store.set(bestKey(), best); }
        hud();
        toast('Wobbly! Your tower is ' + st.score + ' blocks tall.');
        if (audio.isOn()) audio.note(196, { dur: 0.6, gain: 0.2, type: 'triangle', bell: false });
        return;
      }
      var perfect = Math.abs(c.x - top.x) < 5, nx = c.x, nw = c.w;
      if (perfect) {
        nx = top.x;
        nw = top.w;
        st.combo = (st.combo || 0) + 1;
        if (comboEl) {
          comboEl.hidden = false;
          comboEl.textContent = (st.combo > 1 ? st.combo + 'x Combo! ✨' : 'Perfect! ✨');
        }
      } else {
        st.combo = 0;
        if (comboEl) comboEl.hidden = true;
        if (c.x < top.x) st.chips.push({ x: c.x, w: top.x - c.x, y: levelY(c.i), vy: 0, i: c.i });
        else st.chips.push({ x: top.x + top.w, w: c.x + c.w - (top.x + top.w), y: levelY(c.i), vy: 0, i: c.i });
        nx = left;
        nw = ov;
      }
      st.stack.push({ x: nx, w: nw, i: c.i });
      st.score += 1;
      if (st.score >= 10 && PIP.stickers) PIP.stickers.unlock('blocks10');
      if (audio.isOn()) {
        var pitchMult = Math.pow(1.1, Math.min(st.combo, 8));
        var f = audio.SCALE[st.score % 5] * (st.score % 10 < 5 ? 1 : 1.5) * pitchMult;
        audio.note(f, { dur: perfect ? 1.4 : 0.8, gain: perfect ? 0.22 : 0.15 });
        if (perfect) audio.note(f * 1.5, { dur: 1.2, gain: 0.1, when: 0.07 });
      }
      if (st.score > best) { best = st.score; store.set(bestKey(), best); }
      hud();
      spawn();
    }

    function update(dt) {
      if (!st.over && st.cur) {
        var c = st.cur, speed = Math.min(mode.base + st.score * mode.step, mode.max);
        c.x += c.dir * speed * dt;
        if (c.x < 0) { c.x = 0; c.dir = 1; }
        if (c.x + c.w > W) { c.x = W - c.w; c.dir = -1; }
      }
      var target = Math.max(0, st.stack.length - 9) * BH;
      st.cam += (target - st.cam) * Math.min(1, dt * 6);
      st.chips.forEach(function (p) { p.vy += 900 * dt; p.y += p.vy * dt; });
      st.chips = st.chips.filter(function (p) { return p.y < H + st.cam + 60; });
    }

    function block(b, y, idx, alpha) {
var col = theme.pal[idx % theme.pal.length];
      ctx.globalAlpha = alpha || 1;
      rr(b.x, y, b.w, BH - 2, 7);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = theme.line;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      rr(b.x + 4, y + 3, b.w - 8, 6, 3);
      ctx.fill();
      if (b.w > 34) {
       ctx.fillStyle = theme.line;
        ctx.font = '600 15px Fredoka, "Trebuchet MS", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(LET.charAt(idx % LET.length), b.x + b.w / 2, y + BH / 2);
      }
      ctx.globalAlpha = 1;
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
          if (theme.bg) { ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, W, H); }
      // floor
      ctx.fillStyle = theme.floor;
      ctx.fillRect(0, H - 10 + st.cam, W, 10 + 400);

      // Subtle dotted horizontal "Record Height" marker (bestMarker)
      if (best > 0) {
        var bestMarker = levelY(best) + st.cam;
        if (bestMarker >= -20 && bestMarker <= H + 20) {
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = theme.dark ? 'rgba(255, 215, 0, 0.45)' : 'rgba(92, 64, 51, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(8, bestMarker);
          ctx.lineTo(W - 8, bestMarker);
          ctx.stroke();

          ctx.fillStyle = theme.dark ? 'rgba(255, 215, 0, 0.85)' : 'rgba(92, 64, 51, 0.8)';
          ctx.font = '500 11px Fredoka, system-ui, sans-serif';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText('Record Height: ' + best, W - 12, bestMarker - 3);
          ctx.restore();
        }
      }
      st.stack.forEach(function (b, i) { block(b, levelY(i) + st.cam, i); });
      st.chips.forEach(function (p) { block(p, p.y + st.cam, p.i, 0.9); });
      if (st.cur) block(st.cur, levelY(st.cur.i) + st.cam, st.cur.i);
      if (st.over || st.score === 0) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (st.over) {
          ctx.fillStyle = 'rgba(20, 10, 24, 0.8)';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#fff8f1';
          ctx.font = '600 26px Fredoka, system-ui, sans-serif';
          ctx.fillText('Wobbly! ' + st.score + ' tall', W / 2, H / 2 - 12);
          ctx.font = '500 16px Fredoka, system-ui, sans-serif';
          ctx.fillText('Tap to build again', W / 2, H / 2 + 20);
        } else {
          var isNight = document.documentElement.getAttribute('data-theme') === 'night';
          ctx.fillStyle = (isNight || theme.dark) ? '#ffe9d2' : '#5c4033';
          ctx.font = '500 15px Fredoka, system-ui, sans-serif';
          ctx.fillText('Tap to drop the block', W / 2, 40);
        }
      }
    }

    function loop() {
      raf = window.requestAnimationFrame(function (now) {
        var dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        update(dt);
        draw();
        if (visible && !document.hidden) loop(); else raf = 0;
      });
    }

    cv.addEventListener('pointerdown', function (e) { e.preventDefault(); drop(); });
    cv.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); drop(); }
    });
    if (btn) btn.addEventListener('click', drop);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && visible && !raf) { last = performance.now(); loop(); }
    });
    PIP.watchVisible(cv, function (v) {
      visible = v;
      if (v && !raf) { last = performance.now(); loop(); }
    });

    function updateDpr() {
      var nextDpr = Math.min(window.devicePixelRatio || 1, 2);
      if (nextDpr !== dpr) {
        dpr = nextDpr;
        cv.width = W * dpr;
        cv.height = H * dpr;
        draw();
      }
    }
    window.addEventListener('resize', updateDpr);

    reset();
    draw();
  }

  /* =====================================================================
     4. DREAM DELIVERY ROUTE (SVG path synced to scroll)
     ===================================================================== */
  var HOUSE_STORIES = [
    "Boo-ton fell fast asleep hugging his favourite wooden button after Pip tucked him in.",
    "The twins curled together under a patch quilt dreaming of chasing yarn across the clouds.",
    "Mother Hoot turned down her twig lamp and closed her eyes to gentle night breezes.",
    "Little Wisp drifted into a warm dream of golden stars and lavender soup.",
    "Fern curled his bushy tail around his nose and dozed off under pine branches.",
    "Three little frogs rested on lily pads humming quiet water lullabies until morning.",
    "The velvet moths settled around the glowing lantern enjoying peaceful, warm dreams."
  ];

  function initRoute() {
    var win = $('#route'), path = $('#routePath'), rider = $('#rider'), label = $('#routeLabel'), btn = $('#flyBtn');
    if (!win || !path || !rider || !path.getTotalLength) return;
    var houses = $$('#routeSvg .house');
    var len = path.getTotalLength();
    var p = 0, manual = false;
    var storyBox = $('#houseStory'), storyTitle = $('#houseStoryTitle'), storyText = $('#houseStoryText'), storyClose = $('#houseStoryClose');
    var activeHouse = null;

    // progress at which the route passes each house
    var samples = [];
    for (var i = 0; i <= 240; i++) samples.push(path.getPointAtLength(len * i / 240).x);
    var at = houses.map(function (h) {
      var hx = parseFloat(h.getAttribute('data-x'));
      for (var j = 0; j < samples.length; j++) if (samples[j] >= hx) return j / 240;
      return 1;
    });

    function openStory(h, idx) {
      var isPassed = h.classList.contains('is-lit') || h.getAttribute('data-passed') === 'true';
      if (!isPassed) {
        if (label) label.textContent = 'Pip is still flying! Deliver to ' + h.getAttribute('data-name') + ' first.';
        return;
      }

      var name = h.getAttribute('data-name') || ('House ' + (idx + 1));
      var story = h.getAttribute('data-story') || (HOUSE_STORIES && HOUSE_STORIES[idx]) || '';

      if (activeHouse && activeHouse !== h) {
        activeHouse.classList.remove('is-active');
        activeHouse.setAttribute('aria-expanded', 'false');
      }

      activeHouse = h;
      h.classList.add('is-active');
      h.setAttribute('aria-expanded', 'true');

      if (storyBox) {
        if (storyTitle) storyTitle.textContent = name;
        if (storyText) storyText.textContent = story;
        storyBox.removeAttribute('hidden');
        storyBox.classList.add('is-open');
      }

      if (label) {
        label.textContent = name + ': ' + story;
      }

      if (audio && typeof audio.isOn === 'function' && audio.isOn()) {
        if (audio.pad) {
          audio.pad(audio.SCALE[(idx + 2) % audio.SCALE.length], { dur: 1.8, gain: 0.12 });
        } else {
          audio.note(audio.SCALE[(idx + 2) % audio.SCALE.length], {
            dur: 1.8,
            gain: 0.12,
            adsr: { a: 0.4, d: 0.3, s: 0.6, r: 0.8 },
            bell: false
          });
        }
      }
    }

    function closeStory() {
      var prevHouse = activeHouse;
      if (activeHouse) {
        activeHouse.classList.remove('is-active');
        activeHouse.setAttribute('aria-expanded', 'false');
        activeHouse = null;
      }
      if (storyBox) {
        storyBox.setAttribute('hidden', '');
        storyBox.classList.remove('is-open');
      }
      if (prevHouse && typeof prevHouse.focus === 'function') {
        prevHouse.focus({ preventScroll: true });
      }
    }

    houses.forEach(function (h, idx) {
      h.setAttribute('tabindex', '0');
      h.setAttribute('role', 'button');
      h.setAttribute('aria-haspopup', 'dialog');
      h.setAttribute('aria-expanded', 'false');

      h.addEventListener('click', function (e) {
        e.stopPropagation();
        openStory(h, idx);
      });

      h.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          openStory(h, idx);
        } else if (e.key === 'Escape') {
          closeStory();
        }
      });
    });

    if (storyClose) {
      storyClose.addEventListener('click', function (e) {
        e.stopPropagation();
        closeStory();
      });
    }

    document.addEventListener('click', function (e) {
      if (storyBox && !storyBox.hasAttribute('hidden') && !storyBox.contains(e.target)) {
        closeStory();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && storyBox && !storyBox.hasAttribute('hidden')) {
        closeStory();
      }
    });

    function set(v) {
      p = clamp(v, 0, 1);
      var pt = path.getPointAtLength(len * p);
      rider.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')');
      var passed = -1;
      houses.forEach(function (h, k) {
        var on = p >= at[k];
        if (on) {
          h.classList.add('is-lit');
          h.setAttribute('data-passed', 'true');
          passed = k;
        } else if (!h.hasAttribute('data-passed')) {
          h.classList.remove('is-lit');
        }
      });
      if (p <= 0.01) label.textContent = 'Waiting at the nursery window';
      else if (p >= 0.995) {
        label.textContent = 'All seven dreams delivered';
        if (PIP.stickers) PIP.stickers.unlock('route7');
      }
      else if (passed >= 0) label.textContent = 'Delivered to ' + houses[passed].getAttribute('data-name');
      else label.textContent = 'Taking off...';
    }

    function fromScroll() {
      if (manual) return;
      var r = win.getBoundingClientRect(), vh = window.innerHeight;
      set((vh * 0.85 - r.top) / (vh * 0.65));
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; fromScroll(); });
    }, { passive: true });
    window.addEventListener('resize', fromScroll);

    btn.addEventListener('click', function () {
      if (manual) return;
      if (reduce.matches) { set(p >= 0.99 ? 0 : 1); return; }
      manual = true;
      btn.setAttribute('aria-busy', 'true');
      var t0 = performance.now(), dur = 5200;
      (function step(now) {
        var k = clamp((now - t0) / dur, 0, 1);
        var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // ease in-out
        set(e);
        if (k < 1) window.requestAnimationFrame(step);
        else window.setTimeout(function () {
          manual = false;
          btn.removeAttribute('aria-busy');
        }, 1500);
      })(t0);
      if (audio.isOn()) {
        [0, 2, 4, 3, 5, 4, 7].forEach(function (n, k) {
          if (audio.pad) {
            audio.pad(audio.SCALE[n], { dur: 2.0, gain: 0.1, when: 0.4 + k * 0.7 });
          } else {
            audio.note(audio.SCALE[n], {
              dur: 2.0,
              gain: 0.1,
              when: 0.4 + k * 0.7,
              adsr: { a: 0.5, d: 0.4, s: 0.6, r: 0.9 },
              bell: false
            });
          }
        });
      }
    });

    fromScroll();
  }

  /* =====================================================================
     5. BEDTIME STORYBOOK (flipbook)
     ===================================================================== */
  function initStorybook() {
    var book = $('#book'), prevBtn = $('#bookPrev'), nextBtn = $('#bookNext'), ind = $('#bookInd');
    if (!book || !prevBtn || !nextBtn || !ind) return;
    var pages = $$('.book-page', book);
    var total = pages.length;
    var current = 0;

    var speechBtn = document.getElementById('storySpeechBtn');
    var pauseBtn = document.getElementById('storyPauseBtn');
    var stopBtn = document.getElementById('storyStopBtn');

    function stopSpeech() {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (speechBtn) speechBtn.hidden = false;
      if (pauseBtn) { pauseBtn.hidden = true; pauseBtn.textContent = '⏸ Pause'; }
      if (stopBtn) stopBtn.hidden = true;
    }

    if (speechBtn && 'speechSynthesis' in window) {
      speechBtn.addEventListener('click', function () {
        var activePage = pages[current];
        if (!activePage) return;
        var textToRead = (activePage.querySelector('h4')?.textContent || '') + '. ' + (activePage.querySelector('p')?.textContent || '');
        window.speechSynthesis.cancel();
        var utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = 0.9;
        utterance.onstart = function () {
          speechBtn.hidden = true;
          if (pauseBtn) pauseBtn.hidden = false;
          if (stopBtn) stopBtn.hidden = false;
        };
        utterance.onend = stopSpeech;
        window.speechSynthesis.speak(utterance);
      });
    } else if (speechBtn) {
      speechBtn.style.display = 'none';
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', function () {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          pauseBtn.textContent = '⏸ Pause';
        } else if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          pauseBtn.textContent = '▶ Resume';
        }
      });
    }
    if (stopBtn) stopBtn.addEventListener('click', stopSpeech);

    function renderPage(idx) {
      stopSpeech(); 
      current = clamp(idx, 0, total - 1);
      pages.forEach(function (page, i) {
        var isCur = i === current;
        page.classList.toggle('is-current', isCur);
        page.classList.toggle('is-past', i < current);
        if (isCur) {
          page.removeAttribute('aria-hidden');
          page.removeAttribute('inert');
        } else {
          page.setAttribute('aria-hidden', 'true');
          page.setAttribute('inert', '');
        }
      });
      ind.textContent = 'Page ' + (current + 1) + ' of ' + total;
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === total - 1;
      prevBtn.setAttribute('aria-disabled', current === 0 ? 'true' : 'false');
      nextBtn.setAttribute('aria-disabled', current === total - 1 ? 'true' : 'false');
    }

    prevBtn.addEventListener('click', function () {
      if (current > 0) {
        renderPage(current - 1);
        if (audio.isOn()) audio.pop();
      }
    });

    nextBtn.addEventListener('click', function () {
      if (current < total - 1) {
        renderPage(current + 1);
        if (audio.isOn()) audio.pop();
      }
    });

    book.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        nextBtn.click();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevBtn.click();
      }
    });

    var touchStartX = 0, touchStartY = 0;
    book.addEventListener('touchstart', function (e) {
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    book.addEventListener('touchend', function (e) {
      if (!touchStartX) return;
      var touchEndX = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0;
      var touchEndY = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : 0;
      var dx = touchEndX - touchStartX;
      var dy = touchEndY - touchStartY;
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0 && current < total - 1) nextBtn.click();
        else if (dx > 0 && current > 0) prevBtn.click();
      }
      touchStartX = 0;
    }, { passive: true });
     
    renderPage(0);
  }

  /* =====================================================================
     6. PIP'S GROWTH CHART
     ===================================================================== */
  function initGrowthChart() {
    var chart = $('#growthChart');
    if (!chart) return;
    var steps = $$('.growth-step', chart);

    steps.forEach(function (step) {
      var progress = clamp(parseFloat(step.getAttribute('data-progress')) || 0, 0, 100);
      var fill = $('.growth-fill', step);
      if (fill) fill.style.setProperty('--progress', progress);
    });

    PIP.watchVisible(chart, function (visible) {
      if (visible) chart.classList.add('is-visible');
    }, '0px');
  }

  function updateLeaderboardList(list, newScore, mode) {
    var copy = Array.isArray(list) ? list.filter(function (entry) {
      if (typeof entry === 'number' && !isNaN(entry) && entry > 0) return true;
      return entry && typeof entry === 'object' && typeof entry.score === 'number' && entry.score > 0;
    }).map(function (entry) {
      if (typeof entry === 'number') return { score: Math.floor(entry), mode: 'normal', date: '' };
      return {
        score: Math.floor(entry.score),
        mode: typeof entry.mode === 'string' ? entry.mode : 'normal',
        date: typeof entry.date === 'string' ? entry.date : ''
      };
    }) : [];

    if (newScore && typeof newScore === 'number' && newScore > 0) {
      var d = new Date();
      var dateStr = (d.getMonth() + 1) + '/' + d.getDate();
      copy.push({
        score: Math.floor(newScore),
        mode: mode || 'normal',
        date: dateStr
      });
    }
    copy.sort(function (a, b) { return b.score - a.score; });
    return copy.slice(0, 5);
  }

  function getComboPitchMultiplier(combo) {
    if (!combo || combo <= 1) return 1;
    return Math.pow(1.08, Math.min(combo - 1, 8));
  }

  function getBestMarkerY(best, cam) {
    var H = 420, BH = 28;
    return (H - 10 - (best + 1) * BH) + (cam || 0);
  }

  function getPIP() {
    if (typeof window !== 'undefined' && window.PIP) return window.PIP;
    if (typeof global !== 'undefined' && global.PIP) return global.PIP;
    return PIP;
  }

  function getStore() {
    var p = getPIP();
    return (p && p.store) ? p.store : store;
  }

  function exportScores() {
    var curStore = getStore();
    var topScores = [];
    try {
      var raw = curStore.get('blockTopScores', '[]');
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        topScores = parsed.filter(function (s) { return typeof s === 'number' && !isNaN(s) && s > 0; })
                          .sort(function (a, b) { return b - a; })
                          .slice(0, 5);
      }
    } catch (e) {}

    var best = parseInt(curStore.get('best', '0'), 10) || 0;
    var mode = curStore.get('blockMode', 'normal') || 'normal';

    var payload = {
      game: 'rattle-and-blocks',
      version: '1.0',
      best: best,
      mode: mode,
      topScores: topScores,
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(payload, null, 2);
  }

  function importScores(json) {
    var curStore = getStore();
    var data = json;
    if (typeof json === 'string') {
      try {
        data = JSON.parse(json);
      } catch (e) {
        return false;
      }
    }
    if (!data || typeof data !== 'object') return false;

    var list = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (Array.isArray(data.topScores)) {
      list = data.topScores;
    } else if (Array.isArray(data.scores)) {
      list = data.scores;
    }

    var validScores = list.map(function (val) {
      if (typeof val === 'number') return val;
      if (val && typeof val === 'object' && typeof val.score === 'number') return val.score;
      return parseInt(val, 10);
    }).filter(function (s) {
      return typeof s === 'number' && !isNaN(s) && s > 0;
    }).sort(function (a, b) {
      return b - a;
    }).slice(0, 5);

    curStore.set('blockTopScores', JSON.stringify(validScores));

    var importedBest = 0;
    if (typeof data.best === 'number' && !isNaN(data.best) && data.best > 0) {
      importedBest = data.best;
    } else if (validScores.length > 0) {
      importedBest = validScores[0];
    }

    if (importedBest > 0) {
      var curBest = parseInt(curStore.get('best', '0'), 10) || 0;
      if (importedBest > curBest) {
        curStore.set('best', importedBest);
      }
    }

    if (typeof blocksRenderLeaderboard === 'function') {
      blocksRenderLeaderboard(validScores);
    }
    if (typeof blocksSyncBest === 'function' && importedBest > 0) {
      blocksSyncBest(importedBest);
    }

    return true;
  }

  PIP.toys = {
    HOUSE_STORIES: HOUSE_STORIES,
    updateLeaderboardList: updateLeaderboardList,
    getComboPitchMultiplier: getComboPitchMultiplier,
    getBestMarkerY: getBestMarkerY,
    exportScores: exportScores,
    importScores: importScores,
    init: function () {
      initLab();
      initLights();
      initBlocks();
      initRoute();
      initStorybook();
      initGrowthChart();
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      HOUSE_STORIES: HOUSE_STORIES,
      updateLeaderboardList: updateLeaderboardList,
      getComboPitchMultiplier: getComboPitchMultiplier,
      getBestMarkerY: getBestMarkerY,
      exportScores: exportScores,
      importScores: importScores
    };
  }
})();
