/* constellations.js: Constellation Dream Cartographer mini-game (pip-sky.exe).
   Connect-the-stars vector telescope game revealing celestial bedtime lore. */
(function () {
  'use strict';
  var PIP = (typeof window !== 'undefined' && window.PIP) ? window.PIP : {};
  var $ = PIP.$ || function (sel) { return document.querySelector(sel); };
  var $$ = PIP.$$ || function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  var store = PIP.store || { get: function () { return ''; }, set: function () {} };
  var toast = PIP.toast || function () {};

  var CONSTELLATIONS = [
    {
      id: 'nightcap',
      name: "Pip's Sleepy Nightcap",
      lore: 'The celestial cap worn by Pip on nights when the Moon reads bedtime stories to the sleeping stars.',
      stars: [
        { x: 0.25, y: 0.75 },
        { x: 0.50, y: 0.20 },
        { x: 0.75, y: 0.75 },
        { x: 0.25, y: 0.75 },
        { x: 0.55, y: 0.12 } // Tassel pompom
      ]
    },
    {
      id: 'swan',
      name: 'The Starlight Swan',
      lore: 'Glides across the cosmic river of milk, dropping soft feathers of gentle dreams upon the nursery.',
      stars: [
        { x: 0.50, y: 0.15 },
        { x: 0.50, y: 0.50 },
        { x: 0.20, y: 0.45 },
        { x: 0.80, y: 0.45 },
        { x: 0.50, y: 0.85 }
      ]
    },
    {
      id: 'crown',
      name: "The Queen's Crown",
      lore: 'A radiant zigzag crown gleaming softly above the nursery roof, guarding restful sleep.',
      stars: [
        { x: 0.15, y: 0.35 },
        { x: 0.30, y: 0.65 },
        { x: 0.50, y: 0.35 },
        { x: 0.70, y: 0.65 },
        { x: 0.85, y: 0.35 }
      ]
    }
  ];

  var activeIndex = 0;
  var connectedStars = [];
  var discovered = {};
  try {
    var stored = JSON.parse(store.get('pip_constellations', '{}') || '{}');
    if (stored && typeof stored === 'object') discovered = stored;
  } catch (e) {
    discovered = {};
  }

  var canvas = null;
  var ctx = null;

  function getActiveConstellation() {
    return CONSTELLATIONS[activeIndex];
  }

  function setConstellationIndex(idx) {
    if (idx >= 0 && idx < CONSTELLATIONS.length) {
      activeIndex = idx;
      connectedStars = [];
      renderSky();
      updateInfoUI();
    }
    return activeIndex;
  }

  function connectStar(starIdx) {
    var current = getActiveConstellation();
    if (!current || starIdx < 0 || starIdx >= current.stars.length) return false;

    // Check if star is already connected
    if (connectedStars.indexOf(starIdx) !== -1) return false;

    // Check if it's the expected next star in sequence (or can connect in order)
    if (starIdx === connectedStars.length) {
      connectedStars.push(starIdx);

      // Play soft chime
      if (PIP.audio && typeof PIP.audio.note === 'function' && PIP.audio.isOn()) {
        var baseFreq = 523.25; // C5
        var stepFreq = baseFreq * Math.pow(1.122, starIdx);
        PIP.audio.note(stepFreq, { dur: 0.5, gain: 0.15 });
      }

      // Check if complete
      if (connectedStars.length === current.stars.length) {
        discovered[current.id] = true;
        store.set('pip_constellations', JSON.stringify(discovered));
        if (PIP.fx && typeof PIP.fx.confetti === 'function') {
          PIP.fx.confetti(60);
        }
        toast('Constellation Discovered: ' + current.name + '!');
      }

      renderSky();
      updateInfoUI();
      return true;
    }
    return false;
  }

  function isComplete() {
    var current = getActiveConstellation();
    return current ? (connectedStars.length === current.stars.length) : false;
  }

  function resetCurrent() {
    connectedStars = [];
    renderSky();
    updateInfoUI();
  }

  function nextConstellation() {
    var nextIdx = (activeIndex + 1) % CONSTELLATIONS.length;
    setConstellationIndex(nextIdx);
  }

  function renderSky() {
    if (!canvas || !ctx) return;
    var w = canvas.width;
    var h = canvas.height;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    ctx.clearRect(0, 0, w, h);

    var current = getActiveConstellation();
    if (!current) return;

    var cssW = w / dpr;
    var cssH = h / dpr;

    // Draw connected constellation lines
    if (connectedStars.length > 1) {
      ctx.beginPath();
      var firstStar = current.stars[connectedStars[0]];
      ctx.moveTo(firstStar.x * cssW, firstStar.y * cssH);
      for (var i = 1; i < connectedStars.length; i++) {
        var s = current.stars[connectedStars[i]];
        ctx.lineTo(s.x * cssW, s.y * cssH);
      }
      ctx.strokeStyle = '#f3b562';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#f3b562';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw all stars
    for (var j = 0; j < current.stars.length; j++) {
      var star = current.stars[j];
      var sx = star.x * cssW;
      var sy = star.y * cssH;
      var isConnected = connectedStars.indexOf(j) !== -1;
      var isNext = (j === connectedStars.length);

      ctx.save();
      ctx.translate(sx, sy);

      // Glow circle
      ctx.beginPath();
      ctx.arc(0, 0, isConnected ? 7 : (isNext ? 9 : 5), 0, Math.PI * 2);
      ctx.fillStyle = isConnected ? '#f3b562' : (isNext ? '#ffffff' : 'rgba(255, 255, 255, 0.45)');
      if (isConnected || isNext) {
        ctx.shadowColor = '#f3b562';
        ctx.shadowBlur = isNext ? 12 : 8;
      }
      ctx.fill();

      // Number badge for guidance
      ctx.fillStyle = isConnected ? '#1e1636' : '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(j + 1, 0, 0);

      ctx.restore();
    }
  }

  function handleCanvasClick(e) {
    if (!canvas) return;
    var rect = canvas.getBoundingClientRect();
    var clickX = e.clientX - rect.left;
    var clickY = e.clientY - rect.top;

    var current = getActiveConstellation();
    if (!current) return;

    var hitRadius = 24; // generous touch hit target
    for (var i = 0; i < current.stars.length; i++) {
      var sx = current.stars[i].x * rect.width;
      var sy = current.stars[i].y * rect.height;
      var dist = Math.hypot(clickX - sx, clickY - sy);
      if (dist <= hitRadius) {
        connectStar(i);
        break;
      }
    }
  }

  function updateInfoUI() {
    if (typeof document === 'undefined') return;
    var current = getActiveConstellation();
    if (!current) return;

    var titleEl = $('#skyConstellationName');
    if (titleEl) {
      titleEl.textContent = current.name + (discovered[current.id] ? ' ⭐ [Mapped]' : '');
    }

    var progressEl = $('#skyProgress');
    if (progressEl) {
      progressEl.textContent = 'Stars Linked: ' + connectedStars.length + ' / ' + current.stars.length;
    }

    var loreEl = $('#skyLore');
    if (loreEl) {
      if (isComplete() || discovered[current.id]) {
        loreEl.textContent = current.lore;
        loreEl.removeAttribute('hidden');
      } else {
        loreEl.textContent = 'Connect stars 1 through ' + current.stars.length + ' to decipher this celestial dream...';
      }
    }
  }

  function setupCanvas() {
    if (typeof document === 'undefined') return;
    canvas = document.getElementById('skyCanvas');
    if (!canvas) return;
    ctx = canvas.getContext && canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    canvas.addEventListener('click', handleCanvasClick);
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderSky();
  }

  function initSkyUI() {
    setupCanvas();
    var resetBtn = $('#skyResetBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetCurrent);

    var nextBtn = $('#skyNextBtn');
    if (nextBtn) nextBtn.addEventListener('click', nextConstellation);

    updateInfoUI();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSkyUI);
    } else {
      initSkyUI();
    }
  }

  PIP.sky = {
    CONSTELLATIONS: CONSTELLATIONS,
    getActiveConstellation: getActiveConstellation,
    setConstellationIndex: setConstellationIndex,
    connectStar: connectStar,
    isComplete: isComplete,
    resetCurrent: resetCurrent,
    nextConstellation: nextConstellation,
    getDiscovered: function () { return discovered; }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PIP.sky;
  }
})();
