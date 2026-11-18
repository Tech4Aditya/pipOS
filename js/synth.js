/* synth.js: Starlight Synthesizer & 8-step pentatonic lullaby sequencer (pip-synth.exe).
   Synthesizes live procedural melodies with Web Audio and generates offline WAV downloads. */
(function () {
  'use strict';
  var PIP = (typeof window !== 'undefined' && window.PIP) ? window.PIP : {};
  var $ = PIP.$ || function (sel) { return document.querySelector(sel); };
  var $$ = PIP.$$ || function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  var toast = PIP.toast || function () {};

  var NOTES = [
    { name: 'C5', freq: 523.25 },
    { name: 'D5', freq: 587.33 },
    { name: 'E5', freq: 659.25 },
    { name: 'G5', freq: 783.99 },
    { name: 'A5', freq: 880.00 }
  ];
  var NUM_STEPS = 8;
  var NUM_NOTES = NOTES.length;

  var grid = [];
  for (var s = 0; s < NUM_STEPS; s++) {
    var col = [];
    for (var n = 0; n < NUM_NOTES; n++) {
      col.push(false);
    }
    grid.push(col);
  }

  // Pre-seed a gentle twinkle pattern
  grid[0][0] = true; // C5
  grid[1][1] = true; // D5
  grid[2][2] = true; // E5
  grid[4][3] = true; // G5
  grid[6][4] = true; // A5

  var isPlaying = false;
  var currentStep = -1;
  var bpm = 90;
  var waveform = 'sine';
  var timer = null;

  function toggleCell(step, noteIdx) {
    if (step < 0 || step >= NUM_STEPS || noteIdx < 0 || noteIdx >= NUM_NOTES) return false;
    grid[step][noteIdx] = !grid[step][noteIdx];
    return grid[step][noteIdx];
  }

  function getCell(step, noteIdx) {
    if (step < 0 || step >= NUM_STEPS || noteIdx < 0 || noteIdx >= NUM_NOTES) return false;
    return grid[step][noteIdx];
  }

  function clearGrid() {
    for (var i = 0; i < NUM_STEPS; i++) {
      for (var j = 0; j < NUM_NOTES; j++) {
        grid[i][j] = false;
      }
    }
    renderGrid();
  }

  function setBpm(val) {
    var parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 50 && parsed <= 180) {
      bpm = parsed;
      if (isPlaying) {
        stop();
        play();
      }
    }
    return bpm;
  }

  function getBpm() {
    return bpm;
  }

  function setWaveform(wf) {
    if (wf === 'sine' || wf === 'triangle') {
      waveform = wf;
    }
    return waveform;
  }

  function getWaveform() {
    return waveform;
  }

  function advanceStep() {
    currentStep = (currentStep + 1) % NUM_STEPS;
    playStep(currentStep);
    updateStepUI(currentStep);
  }

  function playStep(stepIdx) {
    if (typeof PIP.audio === 'undefined' || typeof PIP.audio.note !== 'function' || !PIP.audio.isOn()) return;
    for (var n = 0; n < NUM_NOTES; n++) {
      if (grid[stepIdx][n]) {
        PIP.audio.note(NOTES[n].freq, {
          type: waveform,
          dur: 0.6,
          gain: 0.18,
          adsr: { a: 0.01, d: 0.08, s: 0.5, r: 0.3 }
        });
      }
    }
  }

  function play() {
    if (isPlaying) return;
    if (PIP.audio && typeof PIP.audio.request === 'function' && !PIP.audio.isOn()) {
      PIP.audio.request();
    }
    isPlaying = true;
    currentStep = -1;
    var stepInterval = (60 / bpm / 2) * 1000;
    advanceStep();
    timer = setInterval(advanceStep, stepInterval);
    updatePlayStateUI(true);
  }

  function stop() {
    if (!isPlaying) return;
    isPlaying = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    currentStep = -1;
    updateStepUI(-1);
    updatePlayStateUI(false);
  }

  function togglePlay() {
    if (isPlaying) stop();
    else play();
  }

  function updateStepUI(activeIdx) {
    if (typeof document === 'undefined') return;
    var cols = $$('.synth-step-col');
    cols.forEach(function (col, idx) {
      if (idx === activeIdx) col.classList.add('is-active-step');
      else col.classList.remove('is-active-step');
    });
  }

  function updatePlayStateUI(playing) {
    if (typeof document === 'undefined') return;
    var btn = $('#synthPlayBtn');
    if (btn) {
      btn.textContent = playing ? '⏸ Pause' : '▶ Play Sequence';
      btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    }
  }

  function renderGrid() {
    if (typeof document === 'undefined') return;
    var container = $('#synthGrid');
    if (!container) return;
    container.innerHTML = '';

    for (var s = 0; s < NUM_STEPS; s++) {
      var col = document.createElement('div');
      col.className = 'synth-step-col';
      col.setAttribute('data-step', s);

      // Render notes from top (highest pitch) to bottom (lowest pitch)
      for (var n = NUM_NOTES - 1; n >= 0; n--) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'synth-cell' + (grid[s][n] ? ' is-on' : '');
        btn.setAttribute('data-step', s);
        btn.setAttribute('data-note', n);
        btn.setAttribute('aria-label', NOTES[n].name + ' at step ' + (s + 1));
        btn.setAttribute('aria-pressed', grid[s][n] ? 'true' : 'false');

        (function (stepIdx, noteIdx, cellBtn) {
          cellBtn.addEventListener('click', function () {
            var state = toggleCell(stepIdx, noteIdx);
            cellBtn.classList.toggle('is-on', state);
            cellBtn.setAttribute('aria-pressed', state ? 'true' : 'false');
            if (state && PIP.audio && PIP.audio.isOn()) {
              PIP.audio.note(NOTES[noteIdx].freq, { dur: 0.4, gain: 0.16, type: waveform });
            }
          });
        })(s, n, btn);

        col.appendChild(btn);
      }
      container.appendChild(col);
    }
  }

  /* ---------- Pure Vanilla 16-bit PCM WAV Encoder ---------- */
  function encodeWav(sampleRate, samples) {
    var buffer = new ArrayBuffer(44 + samples.length * 2);
    var view = new DataView(buffer);

    function writeString(offset, str) {
      for (var i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    }

    // RIFF chunk descriptor
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');

    // fmt sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true);  // AudioFormat (1 = PCM)
    view.setUint16(22, 1, true);  // NumChannels (1 = Mono)
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true);  // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample

    // data sub-chunk
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // Write 16-bit PCM samples
    var offset = 44;
    for (var i = 0; i < samples.length; i++) {
      var s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  function exportSequenceWav() {
    var sampleRate = 22050;
    var stepDuration = (60 / bpm / 2);
    var totalSeconds = stepDuration * NUM_STEPS;
    var totalSamples = Math.floor(sampleRate * totalSeconds);
    var pcm = new Float32Array(totalSamples);

    for (var s = 0; s < NUM_STEPS; s++) {
      var startSample = Math.floor(s * stepDuration * sampleRate);
      var noteSamples = Math.floor(stepDuration * sampleRate * 1.5);

      for (var n = 0; n < NUM_NOTES; n++) {
        if (grid[s][n]) {
          var freq = NOTES[n].freq;
          for (var i = 0; i < noteSamples && (startSample + i) < totalSamples; i++) {
            var t = i / sampleRate;
            var env = Math.exp(-4 * t);
            var val = (waveform === 'triangle')
              ? (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * freq * t))
              : Math.sin(2 * Math.PI * freq * t);
            pcm[startSample + i] += val * env * 0.25;
          }
        }
      }
    }

    var blob = encodeWav(sampleRate, pcm);
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'pip-lullaby-sequence.wav';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
    toast('Exported sequence to pip-lullaby-sequence.wav!');
    return blob;
  }

  function initSynthUI() {
    renderGrid();
    var playBtn = $('#synthPlayBtn');
    if (playBtn) playBtn.addEventListener('click', togglePlay);

    var clearBtn = $('#synthClearBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearGrid);

    var exportBtn = $('#synthExportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportSequenceWav);

    var bpmInput = $('#synthBpm');
    if (bpmInput) {
      bpmInput.addEventListener('input', function (e) {
        setBpm(e.target.value);
        var lbl = $('#synthBpmLabel');
        if (lbl) lbl.textContent = bpm + ' BPM';
      });
    }

    var waveSelect = $('#synthWave');
    if (waveSelect) {
      waveSelect.addEventListener('change', function (e) {
        setWaveform(e.target.value);
      });
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSynthUI);
    } else {
      initSynthUI();
    }
  }

  PIP.synth = {
    toggleCell: toggleCell,
    getCell: getCell,
    clearGrid: clearGrid,
    setBpm: setBpm,
    getBpm: getBpm,
    setWaveform: setWaveform,
    getWaveform: getWaveform,
    play: play,
    stop: stop,
    advanceStep: advanceStep,
    encodeWav: encodeWav,
    exportSequenceWav: exportSequenceWav,
    NOTES: NOTES,
    NUM_STEPS: NUM_STEPS
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PIP.synth;
  }
})();
