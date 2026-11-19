/* voice.js: Text-to-Speech Bedtime Storybook Voice Narrator (pip-voice.exe)
   Synthesizes bedtime stories, nursery scenes, and custom text with pitch/rate controls,
   voice selection, sentence karaoke highlighting, and pentatonic chimes. */
(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
  var PIP = root.PIP || {};
  root.PIP = PIP;

  var BEDTIME_SCENES = [
    {
      title: 'The Midnight Basket',
      text: 'A wicker basket floated through the nursery fog at quarter past midnight. Inside was Pip: tiny skull face, sleepy amber eyes, and a starry nightcap resting crooked. Pip yawned once, smiled at the moon, and made the nursery home.'
    },
    {
      title: 'The Clockwork Cricket',
      text: 'In the quiet corner behind the bookshelf, a tiny silver cricket wound its spring. Chirp, click, chirp. It kept time with Pip\'s breathing, counting every gentle second until dreamland.'
    },
    {
      title: 'The Cloud Loom',
      text: 'Up above the rafters, friendly night clouds spun soft woolen blankets from starlight. Each thread hummed with a quiet lullaby, keeping every dreamer warm and safe.'
    },
    {
      title: 'The Lantern Forest',
      text: 'Floating paper lanterns cast warm golden circles on the floorboards. Pip stepped softly from light to light, leaving tiny footprints made of stardust.'
    },
    {
      title: 'The Sleepy Constellation',
      text: 'High above, Orion and the Big Dipper drew sleepy smiles across the indigo velvet sky. A gentle breeze whispered through the open window, carrying dreams of flying.'
    },
    {
      title: 'Goodnight, Little Dreamer',
      text: 'The sun is still hours away, but Pip\'s eyes are growing heavy. The music box slows, the last lantern flickers low, and the cloud curls up on the rug. Close your eyes now. Pip will watch over your dreams until morning.'
    }
  ];

  var state = {
    pitch: 1.0,
    rate: 0.9,
    volume: 1.0,
    selectedVoiceIndex: 0,
    status: 'idle', // 'idle', 'speaking', 'paused'
    text: BEDTIME_SCENES[0].text,
    voices: []
  };

  var synth = (typeof window !== 'undefined' && window.speechSynthesis) ? window.speechSynthesis : null;
  var currentUtterance = null;

  function loadVoices() {
    if (!synth) return [];
    var vList = synth.getVoices() || [];
    state.voices = vList;
    return vList;
  }

  function setPitch(p) {
    var val = parseFloat(p);
    if (!isNaN(val)) {
      state.pitch = Math.max(0.5, Math.min(2.0, val));
      return true;
    }
    return false;
  }

  function setRate(r) {
    var val = parseFloat(r);
    if (!isNaN(val)) {
      state.rate = Math.max(0.5, Math.min(1.5, val));
      return true;
    }
    return false;
  }

  function setVolume(v) {
    var val = parseFloat(v);
    if (!isNaN(val)) {
      state.volume = Math.max(0.0, Math.min(1.0, val));
      return true;
    }
    return false;
  }

  function setVoiceIndex(idx) {
    var i = parseInt(idx, 10);
    if (!isNaN(i) && i >= 0 && i < state.voices.length) {
      state.selectedVoiceIndex = i;
      return true;
    }
    return false;
  }

  function getScene(idx) {
    if (idx >= 1 && idx <= BEDTIME_SCENES.length) {
      return BEDTIME_SCENES[idx - 1];
    }
    return null;
  }

  function speak(textToRead, onBoundaryCallback) {
    var t = (typeof textToRead === 'string' && textToRead.trim()) ? textToRead : state.text;
    state.text = t;

    if (!synth) {
      state.status = 'speaking';
      return false;
    }

    synth.cancel();

    // Play optional gentle chime cue before reading
    if (PIP.audio && typeof PIP.audio.note === 'function' && PIP.audio.isOn && PIP.audio.isOn()) {
      try {
        PIP.audio.note(659.25, { dur: 0.18, gain: 0.12 });
      } catch (e) {}
    }

    var utt = new SpeechSynthesisUtterance(t);
    utt.pitch = state.pitch;
    utt.rate = state.rate;
    utt.volume = state.volume;

    if (state.voices.length > 0 && state.voices[state.selectedVoiceIndex]) {
      utt.voice = state.voices[state.selectedVoiceIndex];
    }

    utt.onstart = function () {
      state.status = 'speaking';
      updateUIStatus();
    };

    utt.onpause = function () {
      state.status = 'paused';
      updateUIStatus();
    };

    utt.onresume = function () {
      state.status = 'speaking';
      updateUIStatus();
    };

    utt.onend = function () {
      state.status = 'idle';
      currentUtterance = null;
      updateUIStatus();
    };

    utt.onerror = function () {
      state.status = 'idle';
      currentUtterance = null;
      updateUIStatus();
    };

    if (typeof onBoundaryCallback === 'function') {
      utt.onboundary = onBoundaryCallback;
    }

    currentUtterance = utt;
    synth.speak(utt);
    return true;
  }

  function pause() {
    if (synth && synth.speaking && !synth.paused) {
      synth.pause();
      state.status = 'paused';
      updateUIStatus();
      return true;
    }
    return false;
  }

  function resume() {
    if (synth && synth.paused) {
      synth.resume();
      state.status = 'speaking';
      updateUIStatus();
      return true;
    }
    return false;
  }

  function stop() {
    if (synth) {
      synth.cancel();
    }
    state.status = 'idle';
    currentUtterance = null;
    updateUIStatus();
    return true;
  }

  var statusBadge = null;
  var playBtn = null;
  var pauseBtn = null;
  var stopBtn = null;

  function updateUIStatus() {
    if (typeof document === 'undefined') return;
    if (!statusBadge) statusBadge = document.getElementById('voiceStatusBadge');
    if (!playBtn) playBtn = document.getElementById('voicePlayBtn');
    if (!pauseBtn) pauseBtn = document.getElementById('voicePauseBtn');
    if (!stopBtn) stopBtn = document.getElementById('voiceStopBtn');

    if (statusBadge) {
      if (state.status === 'speaking') {
        statusBadge.textContent = '🔊 Narrating...';
        statusBadge.className = 'voice-badge is-active';
      } else if (state.status === 'paused') {
        statusBadge.textContent = '⏸ Paused';
        statusBadge.className = 'voice-badge is-paused';
      } else {
        statusBadge.textContent = '💤 Ready';
        statusBadge.className = 'voice-badge';
      }
    }

    if (playBtn) playBtn.disabled = (state.status === 'speaking');
    if (pauseBtn) pauseBtn.disabled = (state.status !== 'speaking');
    if (stopBtn) stopBtn.disabled = (state.status === 'idle');
  }

  function initUI() {
    if (typeof document === 'undefined') return;
    var win = document.getElementById('voice');
    if (!win) return;

    var textInput = document.getElementById('voiceTextInput');
    var voiceSelect = document.getElementById('voiceSelect');
    var pitchSlider = document.getElementById('voicePitchSlider');
    var pitchVal = document.getElementById('voicePitchVal');
    var rateSlider = document.getElementById('voiceRateSlider');
    var rateVal = document.getElementById('voiceRateVal');
    var trackerBox = document.getElementById('voiceTrackerBox');

    statusBadge = document.getElementById('voiceStatusBadge');
    playBtn = document.getElementById('voicePlayBtn');
    pauseBtn = document.getElementById('voicePauseBtn');
    stopBtn = document.getElementById('voiceStopBtn');

    // Populate voice dropdown
    function refreshVoiceDropdown() {
      if (!voiceSelect) return;
      var voices = loadVoices();
      voiceSelect.innerHTML = '';
      if (voices.length === 0) {
        var opt = document.createElement('option');
        opt.value = '0';
        opt.textContent = 'Default Bedtime Voice';
        voiceSelect.appendChild(opt);
        return;
      }
      voices.forEach(function (v, idx) {
        var opt = document.createElement('option');
        opt.value = String(idx);
        opt.textContent = v.name + ' (' + v.lang + ')';
        if (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Google'))) {
          opt.textContent = '⭐ ' + opt.textContent;
        }
        voiceSelect.appendChild(opt);
      });
      voiceSelect.value = String(state.selectedVoiceIndex);
    }

    if (synth) {
      refreshVoiceDropdown();
      if (typeof synth.addEventListener === 'function') {
        synth.addEventListener('voiceschanged', refreshVoiceDropdown);
      } else if ('onvoiceschanged' in synth) {
        synth.onvoiceschanged = refreshVoiceDropdown;
      }
    }

    if (voiceSelect) {
      voiceSelect.addEventListener('change', function () {
        setVoiceIndex(voiceSelect.value);
      });
    }

    // Sliders
    if (pitchSlider) {
      pitchSlider.value = state.pitch;
      if (pitchVal) pitchVal.textContent = state.pitch.toFixed(1) + 'x';
      pitchSlider.addEventListener('input', function () {
        var p = parseFloat(pitchSlider.value);
        setPitch(p);
        if (pitchVal) pitchVal.textContent = p.toFixed(1) + 'x';
      });
    }

    if (rateSlider) {
      rateSlider.value = state.rate;
      if (rateVal) rateVal.textContent = state.rate.toFixed(1) + 'x';
      rateSlider.addEventListener('input', function () {
        var r = parseFloat(rateSlider.value);
        setRate(r);
        if (rateVal) rateVal.textContent = r.toFixed(1) + 'x';
      });
    }

    // Scene quick buttons
    var sceneBtns = win.querySelectorAll('.voice-scene-btn');
    sceneBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var scNum = parseInt(btn.getAttribute('data-scene'), 10);
        var sc = getScene(scNum);
        if (sc && textInput) {
          textInput.value = sc.title + '. ' + sc.text;
          state.text = textInput.value;
          if (trackerBox) trackerBox.textContent = 'Loaded: ' + sc.title;
        }
      });
    });

    // Action buttons
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        var currentText = textInput ? textInput.value : state.text;
        speak(currentText, function (e) {
          if (trackerBox && e.name === 'word') {
            var word = currentText.substr(e.charIndex, e.charLength || 10);
            trackerBox.textContent = 'Reading: "' + word + '"';
          }
        });
      });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', function () {
        if (state.status === 'speaking') {
          pause();
        } else if (state.status === 'paused') {
          resume();
        }
      });
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', function () {
        stop();
        if (trackerBox) trackerBox.textContent = 'Narration stopped.';
      });
    }

    updateUIStatus();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initUI);
    } else {
      initUI();
    }
  }

  var api = {
    BEDTIME_SCENES: BEDTIME_SCENES,
    speak: speak,
    pause: pause,
    resume: resume,
    stop: stop,
    setPitch: setPitch,
    setRate: setRate,
    setVolume: setVolume,
    setVoiceIndex: setVoiceIndex,
    getScene: getScene,
    loadVoices: loadVoices,
    getState: function () {
      return {
        pitch: state.pitch,
        rate: state.rate,
        volume: state.volume,
        selectedVoiceIndex: state.selectedVoiceIndex,
        status: state.status,
        text: state.text
      };
    }
  };

  PIP.voice = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
