(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
  var PIP = root.PIP = root.PIP || {};

  var MAX_NOTES = 128;
  var MIN_DELAY = 40;
  var MAX_DELAY = 4000;

  function encodeTune(notes) {
    if (!Array.isArray(notes) || notes.length === 0) return '';
    var capped = notes.slice(0, MAX_NOTES);
    var parts = [];

    for (var i = 0; i < capped.length; i++) {
      var item = capped[i];
      if (typeof item !== 'object' || item === null) continue;
      var n = parseInt(item.note, 10);
      var d = parseInt(item.delay, 10);
      if (isNaN(n) || n < 0 || n > 7) continue;
      if (isNaN(d) || d < 0) d = 250;
      d = Math.max(MIN_DELAY, Math.min(MAX_DELAY, d));
      parts.push(n + '_' + d);
    }

    if (parts.length === 0) return '';
    return 'v1~' + parts.join('~');
  }

  function decodeTune(raw) {
    if (typeof raw !== 'string' || !raw) return [];
    var str = raw.trim();
    if (str.indexOf('#tune=') === 0) {
      str = str.substring(6);
    } else if (str.indexOf('tune=') === 0) {
      str = str.substring(5);
    }

    if (str.indexOf('v1~') !== 0) return [];
    var body = str.substring(3);

    // Whitelist only digits, underscores, and tildes
    if (!/^[0-9_~]+$/.test(body)) return [];

    var tokens = body.split('~');
    var result = [];

    for (var i = 0; i < tokens.length; i++) {
      if (result.length >= MAX_NOTES) break;
      var token = tokens[i];
      var pair = token.split('_');
      if (pair.length !== 2) continue;

      var note = parseInt(pair[0], 10);
      var delay = parseInt(pair[1], 10);

      if (isNaN(note) || note < 0 || note > 7) continue;
      if (isNaN(delay) || delay < 0) delay = 250;
      delay = Math.max(MIN_DELAY, Math.min(MAX_DELAY, delay));

      result.push({ note: note, delay: delay });
    }

    return result;
  }

  function initRecorder() {
    var recBtn = document.getElementById('recBtn');
    var recPlayBtn = document.getElementById('recPlayBtn');
    var recShareBtn = document.getElementById('recShareBtn');
    var recStatus = document.getElementById('recStatus');
    var tunePrompt = document.getElementById('tunePrompt');
    var tunePlaySharedBtn = document.getElementById('tunePlaySharedBtn');
    var tuneDismissBtn = document.getElementById('tuneDismissBtn');

    if (!recBtn) return;

    var state = {
      isRecording: false,
      isPlaying: false,
      recordedNotes: [],
      sharedNotes: [],
      lastNoteTime: 0,
      playbackTimers: []
    };

    function clearTimers() {
      for (var i = 0; i < state.playbackTimers.length; i++) {
        clearTimeout(state.playbackTimers[i]);
      }
      state.playbackTimers = [];
      state.isPlaying = false;
    }

    function recordNote(index) {
      if (!state.isRecording) return;
      if (state.recordedNotes.length >= MAX_NOTES) {
        stopRecording();
        if (recStatus) recStatus.textContent = 'Maximum note limit reached (' + MAX_NOTES + ')';
        return;
      }

      var now = Date.now();
      var delay = state.lastNoteTime === 0 ? 0 : Math.min(MAX_DELAY, Math.max(MIN_DELAY, now - state.lastNoteTime));
      state.lastNoteTime = now;

      state.recordedNotes.push({ note: index, delay: delay });

      if (recStatus) {
        recStatus.textContent = 'Recording: ' + state.recordedNotes.length + ' notes';
      }
      if (recPlayBtn) recPlayBtn.disabled = false;
      if (recShareBtn) recShareBtn.disabled = false;
    }

    function startRecording() {
      clearTimers();
      state.recordedNotes = [];
      state.lastNoteTime = 0;
      state.isRecording = true;

      recBtn.textContent = '■ Stop Recording';
      recBtn.setAttribute('aria-pressed', 'true');
      recBtn.classList.add('btn-primary');

      if (recPlayBtn) recPlayBtn.disabled = true;
      if (recShareBtn) recShareBtn.disabled = true;
      if (recStatus) recStatus.textContent = 'Recording... play keys 1-8!';
    }

    function stopRecording() {
      if (!state.isRecording) return;
      state.isRecording = false;

      recBtn.textContent = '● Record Tune';
      recBtn.setAttribute('aria-pressed', 'false');
      recBtn.classList.remove('btn-primary');

      if (state.recordedNotes.length > 0) {
        if (recPlayBtn) recPlayBtn.disabled = false;
        if (recShareBtn) recShareBtn.disabled = false;
        if (recStatus) recStatus.textContent = 'Saved ' + state.recordedNotes.length + ' notes. Ready to replay or share!';
      } else {
        if (recStatus) recStatus.textContent = 'No notes recorded.';
      }
    }

    function playNotesSequence(notes, onDone) {
      if (!Array.isArray(notes) || notes.length === 0) return;
      clearTimers();
      state.isPlaying = true;

      var accumulatedTime = 0;
      for (var i = 0; i < notes.length; i++) {
        (function (item) {
          accumulatedTime += item.delay;
          var t = setTimeout(function () {
            // Trigger note and key visual flash
            if (PIP.toys && typeof PIP.toys.triggerNote === 'function') {
              PIP.toys.triggerNote(item.note);
            } else if (PIP.audio && PIP.audio.isOn()) {
              var scale = PIP.audio.SCALE || [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
              PIP.audio.note(scale[item.note], { dur: 1.4, gain: 0.22 });
            }

            var keys = document.querySelectorAll('#keys .key');
            if (keys && keys[item.note]) {
              keys[item.note].classList.add('is-down');
              setTimeout(function () { keys[item.note].classList.remove('is-down'); }, 180);
            }
          }, accumulatedTime);
          state.playbackTimers.push(t);
        })(notes[i]);
      }

      var finishTimer = setTimeout(function () {
        state.isPlaying = false;
        if (typeof onDone === 'function') onDone();
      }, accumulatedTime + 300);
      state.playbackTimers.push(finishTimer);
    }

    recBtn.addEventListener('click', function () {
      if (state.isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    });

    if (recPlayBtn) {
      recPlayBtn.addEventListener('click', function () {
        if (state.isPlaying) {
          clearTimers();
          recPlayBtn.textContent = '▶ Replay';
          if (recStatus) recStatus.textContent = 'Playback stopped';
          return;
        }

        recPlayBtn.textContent = '⏹ Stop Replay';
        if (recStatus) recStatus.textContent = 'Playing recorded tune...';

        playNotesSequence(state.recordedNotes, function () {
          recPlayBtn.textContent = '▶ Replay';
          if (recStatus) recStatus.textContent = 'Replay finished!';
        });
      });
    }

    if (recShareBtn) {
      recShareBtn.addEventListener('click', function () {
        var hash = encodeTune(state.recordedNotes);
        if (!hash) return;

        var fullUrl = window.location.origin + window.location.pathname + '#tune=' + hash;

        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(fullUrl).then(function () {
            if (recStatus) recStatus.textContent = 'Tune link copied to clipboard! ✨';
          }).catch(function () {
            prompt('Copy this link to share your tune:', fullUrl);
          });
        } else {
          prompt('Copy this link to share your tune:', fullUrl);
        }
      });
    }

    // Check for shared tune in URL hash
    function checkIncomingHash() {
      if (typeof window === 'undefined' || !window.location || !window.location.hash) return;
      var hash = window.location.hash;
      if (hash.indexOf('tune=') !== -1) {
        var decoded = decodeTune(hash);
        if (decoded.length > 0) {
          state.sharedNotes = decoded;
          if (tunePrompt) {
            tunePrompt.classList.remove('hidden');
            tunePrompt.setAttribute('aria-hidden', 'false');
          }
        }
      }
    }

    if (tunePlaySharedBtn) {
      tunePlaySharedBtn.addEventListener('click', function () {
        if (tunePrompt) {
          tunePrompt.classList.add('hidden');
          tunePrompt.setAttribute('aria-hidden', 'true');
        }
        if (recStatus) recStatus.textContent = 'Playing shared lullaby tune...';
        playNotesSequence(state.sharedNotes, function () {
          if (recStatus) recStatus.textContent = 'Shared tune finished!';
        });
      });
    }

    if (tuneDismissBtn) {
      tuneDismissBtn.addEventListener('click', function () {
        if (tunePrompt) {
          tunePrompt.classList.add('hidden');
          tunePrompt.setAttribute('aria-hidden', 'true');
        }
      });
    }

    // Intercept clicks on keys in Lullaby Lab to record notes
    var keysContainer = document.getElementById('keys');
    if (keysContainer) {
      keysContainer.addEventListener('click', function (e) {
        var keyBtn = e.target.closest('.key');
        if (!keyBtn) return;
        var keys = Array.prototype.slice.call(keysContainer.querySelectorAll('.key'));
        var idx = keys.indexOf(keyBtn);
        if (idx >= 0) {
          recordNote(idx);
        }
      });
    }

    checkIncomingHash();

    return {
      state: state,
      recordNote: recordNote,
      startRecording: startRecording,
      stopRecording: stopRecording,
      playNotesSequence: playNotesSequence
    };
  }

  PIP.recorder = {
    encodeTune: encodeTune,
    decodeTune: decodeTune,
    init: initRecorder,
    MAX_NOTES: MAX_NOTES
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      encodeTune: encodeTune,
      decodeTune: decodeTune,
      initRecorder: initRecorder,
      MAX_NOTES: MAX_NOTES
    };
  }
})();
