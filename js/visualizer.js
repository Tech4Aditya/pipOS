/* visualizer.js: Master Audio Oscilloscope & Frequency Spectrum Visualizer (pip-visualizer.exe)
   Renders real-time time-domain waveforms, FFT frequency bars, and circular polar orbits
   connected to the Web Audio master bus, with fallback harmonic synthesis. */
(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
  var PIP = root.PIP || {};
  root.PIP = PIP;

  var THEMES = {
    green: { primary: '#39ff14', secondary: '#00aa00', glow: 'rgba(57, 255, 20, 0.4)', bg: '#081208' },
    amber: { primary: '#ffb000', secondary: '#cc8800', glow: 'rgba(255, 176, 0, 0.4)', bg: '#140e04' },
    berry: { primary: '#ffa6c4', secondary: '#a34063', glow: 'rgba(255, 166, 196, 0.4)', bg: '#1b1430' },
    cyan:  { primary: '#00f5ff', secondary: '#0099cc', glow: 'rgba(0, 245, 255, 0.4)', bg: '#041018' }
  };

  var state = {
    mode: 'waveform', // 'waveform', 'bars', 'orbit'
    theme: 'green',
    gain: 1.0,
    frozen: false,
    animId: null,
    peaks: []
  };

  var canvas = null;
  var ctx = null;
  var analyser = null;
  var dataArray = null;
  var timeArray = null;

  function getAnalyser() {
    if (analyser) return analyser;
    if (PIP.audio) {
      if (typeof PIP.audio.getAnalyser === 'function') {
        analyser = PIP.audio.getAnalyser();
      } else if (PIP.audio.masterBus && typeof PIP.audio.masterBus.getAnalyser === 'function') {
        analyser = PIP.audio.masterBus.getAnalyser();
      }
    }
    return analyser;
  }

  function setMode(newMode) {
    if (['waveform', 'bars', 'orbit'].indexOf(newMode) !== -1) {
      state.mode = newMode;
      return true;
    }
    return false;
  }

  function getMode() {
    return state.mode;
  }

  function setTheme(newTheme) {
    if (THEMES.hasOwnProperty(newTheme)) {
      state.theme = newTheme;
      return true;
    }
    return false;
  }

  function getTheme() {
    return state.theme;
  }

  function setGain(val) {
    var g = parseFloat(val);
    if (!isNaN(g) && g >= 0.2 && g <= 4.0) {
      state.gain = g;
      return true;
    }
    return false;
  }

  function toggleFreeze() {
    state.frozen = !state.frozen;
    return state.frozen;
  }

  function renderGrid(c, w, h) {
    c.save();
    c.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    c.lineWidth = 1;

    // Horizontal center line
    c.beginPath();
    c.moveTo(0, h / 2);
    c.lineTo(w, h / 2);
    c.stroke();

    // Subtle grid lines
    var stepX = w / 8;
    for (var x = stepX; x < w; x += stepX) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, h);
      c.stroke();
    }
    var stepY = h / 6;
    for (var y = stepY; y < h; y += stepY) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }
    c.restore();
  }

  function drawWaveform(c, w, h, data, palette, isLive) {
    c.save();
    c.lineWidth = 2.5;
    c.strokeStyle = palette.primary;
    c.shadowColor = palette.glow;
    c.shadowBlur = 8;

    c.beginPath();
    var sliceWidth = w / data.length;
    var x = 0;

    for (var i = 0; i < data.length; i++) {
      var v = (data[i] - 128) / 128; // -1 to 1
      v = v * state.gain;
      var y = (h / 2) + v * (h * 0.45);

      if (i === 0) {
        c.moveTo(x, y);
      } else {
        c.lineTo(x, y);
      }
      x += sliceWidth;
    }
    c.stroke();
    c.restore();
  }

  function drawBars(c, w, h, data, palette, isLive) {
    c.save();
    var barCount = 32;
    var barWidth = (w / barCount) - 4;
    var step = Math.floor(data.length / barCount) || 1;

    if (state.peaks.length !== barCount) {
      state.peaks = new Array(barCount).fill(0);
    }

    for (var i = 0; i < barCount; i++) {
      var rawVal = data[i * step] || 0;
      var norm = (rawVal / 255) * state.gain;
      norm = Math.min(1.0, norm);
      var barH = Math.max(4, norm * (h * 0.85));

      var bx = i * (barWidth + 4) + 2;
      var by = h - barH - 8;

      // Draw bar gradient
      var grad = c.createLinearGradient(0, by, 0, h);
      grad.addColorStop(0, palette.primary);
      grad.addColorStop(1, palette.secondary);
      c.fillStyle = grad;
      c.fillRect(bx, by, barWidth, barH);

      // Peak hold line
      if (by < state.peaks[i] || state.peaks[i] === 0) {
        state.peaks[i] = by;
      } else {
        state.peaks[i] = Math.min(h - 8, state.peaks[i] + 1.5);
      }

      c.fillStyle = palette.primary;
      c.fillRect(bx, state.peaks[i], barWidth, 2);
    }
    c.restore();
  }

  function drawOrbit(c, w, h, data, palette, simTime) {
    c.save();
    var cx = w / 2;
    var cy = h / 2;
    var baseRadius = Math.min(w, h) * 0.22;
    var count = 36;
    var step = Math.floor(data.length / count) || 1;

    c.translate(cx, cy);
    c.rotate((simTime || 0) * 0.0005);

    // Center pulsating orb
    c.beginPath();
    var avgEnergy = 0;
    for (var k = 0; k < 16; k++) avgEnergy += data[k] || 0;
    avgEnergy = (avgEnergy / 16) / 255;

    c.arc(0, 0, baseRadius * (0.8 + avgEnergy * 0.3 * state.gain), 0, Math.PI * 2);
    c.fillStyle = palette.secondary;
    c.globalAlpha = 0.35;
    c.fill();
    c.globalAlpha = 1.0;
    c.lineWidth = 2;
    c.strokeStyle = palette.primary;
    c.stroke();

    // Radiating petals
    for (var i = 0; i < count; i++) {
      var angle = (i / count) * Math.PI * 2;
      var val = ((data[i * step] || 0) / 255) * state.gain;
      var r = baseRadius + Math.max(6, val * (baseRadius * 0.9));

      var x1 = Math.cos(angle) * baseRadius;
      var y1 = Math.sin(angle) * baseRadius;
      var x2 = Math.cos(angle) * r;
      var y2 = Math.sin(angle) * r;

      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
      c.strokeStyle = palette.primary;
      c.shadowColor = palette.glow;
      c.shadowBlur = 6;
      c.lineWidth = 3;
      c.stroke();
    }
    c.restore();
  }

  function renderFrame(now) {
    if (!canvas || !ctx) {
      if (typeof document !== 'undefined') {
        canvas = document.getElementById('visCanvas');
        if (canvas) ctx = canvas.getContext('2d');
      }
    }
    if (!canvas || !ctx) return;

    var w = canvas.width;
    var h = canvas.height;
    var palette = THEMES[state.theme] || THEMES.green;

    // Clear background
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, w, h);

    renderGrid(ctx, w, h);

    var a = getAnalyser();
    var isLive = false;

    if (a && a.frequencyBinCount) {
      if (!dataArray || dataArray.length !== a.frequencyBinCount) {
        dataArray = new Uint8Array(a.frequencyBinCount);
        timeArray = new Uint8Array(a.frequencyBinCount);
      }
      a.getByteFrequencyData(dataArray);
      a.getByteTimeDomainData(timeArray);

      // Check if actual sound energy is present
      var sum = 0;
      for (var s = 0; s < 16; s++) sum += dataArray[s];
      if (sum > 10) isLive = true;
    }

    // Fallback dreamy harmonic wave if idle or offline
    if (!isLive && !state.frozen) {
      var points = 128;
      if (!timeArray || timeArray.length !== points) {
        timeArray = new Uint8Array(points);
        dataArray = new Uint8Array(points);
      }
      var t = (now || Date.now()) * 0.003;
      for (var i = 0; i < points; i++) {
        var phase = (i / points) * Math.PI * 4;
        var wave = Math.sin(phase + t) * 0.6 + Math.sin(phase * 2.5 - t * 0.7) * 0.3;
        timeArray[i] = Math.round(128 + wave * 64);
        dataArray[i] = Math.round(Math.abs(Math.sin((i / points) * Math.PI + t * 0.5)) * 140);
      }
    }

    if (state.mode === 'waveform') {
      drawWaveform(ctx, w, h, timeArray, palette, isLive);
    } else if (state.mode === 'bars') {
      drawBars(ctx, w, h, dataArray, palette, isLive);
    } else if (state.mode === 'orbit') {
      drawOrbit(ctx, w, h, dataArray, palette, now || Date.now());
    }
  }

  function loop(timestamp) {
    if (!state.frozen) {
      renderFrame(timestamp);
    }
    if (typeof root.requestAnimationFrame === 'function') {
      state.animId = root.requestAnimationFrame(loop);
    }
  }

  function initUI() {
    if (typeof document === 'undefined') return;
    var win = document.getElementById('visualizer');
    if (!win) return;

    canvas = document.getElementById('visCanvas');
    if (canvas) ctx = canvas.getContext('2d');

    // Mode buttons
    var modeBtns = win.querySelectorAll('.vis-mode-btn');
    modeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var m = btn.getAttribute('data-mode');
        if (setMode(m)) {
          modeBtns.forEach(function (b) {
            var active = b.getAttribute('data-mode') === state.mode;
            b.classList.toggle('is-active', active);
            b.setAttribute('aria-pressed', active ? 'true' : 'false');
          });
        }
      });
    });

    // Theme selector
    var themeSel = document.getElementById('visThemeSelect');
    if (themeSel) {
      themeSel.addEventListener('change', function () {
        setTheme(themeSel.value);
      });
    }

    // Gain slider
    var gainSlider = document.getElementById('visGainSlider');
    var gainVal = document.getElementById('visGainVal');
    if (gainSlider) {
      gainSlider.addEventListener('input', function () {
        var g = parseFloat(gainSlider.value);
        setGain(g);
        if (gainVal) gainVal.textContent = g.toFixed(1) + 'x';
      });
    }

    // Freeze button
    var freezeBtn = document.getElementById('visFreezeBtn');
    if (freezeBtn) {
      freezeBtn.addEventListener('click', function () {
        var isFrozen = toggleFreeze();
        freezeBtn.textContent = isFrozen ? '▶ Resume' : '⏸ Freeze';
        freezeBtn.classList.toggle('is-active', isFrozen);
      });
    }

    // Start animation loop
    if (typeof root.requestAnimationFrame === 'function') {
      state.animId = root.requestAnimationFrame(loop);
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initUI);
    } else {
      initUI();
    }
  }

  var api = {
    THEMES: THEMES,
    setMode: setMode,
    getMode: getMode,
    setTheme: setTheme,
    getTheme: getTheme,
    setGain: setGain,
    toggleFreeze: toggleFreeze,
    renderFrame: renderFrame,
    getState: function () {
      return {
        mode: state.mode,
        theme: state.theme,
        gain: state.gain,
        frozen: state.frozen
      };
    }
  };

  PIP.visualizer = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
