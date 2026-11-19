/* clock.js: Celestial Clock, Sleep Timer & Bedtime Pomodoro (pip-clock.exe)
   Combines an SVG analog celestial face with moon phases, digital LED clock,
   bedtime auto-sleep audio muter, and cozy starlight pomodoro intervals. */
(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
  var PIP = root.PIP || {};
  root.PIP = PIP;

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatTime(date, is24h) {
    var d = date || new Date();
    var h = d.getHours();
    var m = pad(d.getMinutes());
    var s = pad(d.getSeconds());

    if (is24h) {
      return pad(h) + ':' + m + ':' + s;
    }
    var ampm = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return pad(h12) + ':' + m + ':' + s + ' ' + ampm;
  }

  function formatSeconds(totalSec) {
    var sec = Math.max(0, Math.floor(totalSec));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return pad(m) + ':' + pad(s);
  }

  function getHandAngles(date) {
    var d = date || new Date();
    var s = d.getSeconds();
    var m = d.getMinutes();
    var h = d.getHours();

    var secAngle = (s / 60) * 360;
    var minAngle = (m / 60) * 360 + (s / 60) * 6;
    var hourAngle = ((h % 12) / 12) * 360 + (m / 60) * 30;

    return {
      second: secAngle,
      minute: minAngle,
      hour: hourAngle,
      isNight: (h < 6 || h >= 18)
    };
  }

  var state = {
    is24h: false,
    sleepTimerSeconds: 0,
    sleepTimerActive: false,
    sleepTimerIntervalId: null,
    pomoMode: 'idle', // 'idle', 'focus', 'rest'
    pomoSeconds: 0,
    pomoIntervalId: null,
    pomoCycles: 0
  };

  function triggerSleepEnd() {
    state.sleepTimerActive = false;
    state.sleepTimerSeconds = 0;
    if (state.sleepTimerIntervalId) {
      clearInterval(state.sleepTimerIntervalId);
      state.sleepTimerIntervalId = null;
    }

    // Auto mute sound if playing
    if (PIP.audio && typeof PIP.audio.isOn === 'function' && PIP.audio.isOn()) {
      if (typeof PIP.audio.toggle === 'function') {
        PIP.audio.toggle();
      }
    }

    if (PIP.toast) {
      PIP.toast('🌙 Sleep timer finished. Goodnight, little dreamer!');
    }

    updateUI();
  }

  function startSleepTimer(minutes) {
    var mins = parseInt(minutes, 10);
    if (isNaN(mins) || mins <= 0) return false;

    if (state.sleepTimerIntervalId) {
      clearInterval(state.sleepTimerIntervalId);
    }

    state.sleepTimerActive = true;
    state.sleepTimerSeconds = mins * 60;

    state.sleepTimerIntervalId = setInterval(function () {
      if (state.sleepTimerSeconds > 0) {
        state.sleepTimerSeconds--;
        updateTimerDisplay();
      } else {
        triggerSleepEnd();
      }
    }, 1000);

    updateUI();
    return true;
  }

  function cancelSleepTimer() {
    state.sleepTimerActive = false;
    state.sleepTimerSeconds = 0;
    if (state.sleepTimerIntervalId) {
      clearInterval(state.sleepTimerIntervalId);
      state.sleepTimerIntervalId = null;
    }
    updateUI();
  }

  function startPomodoro() {
    if (state.pomoIntervalId) clearInterval(state.pomoIntervalId);

    state.pomoMode = 'focus';
    state.pomoSeconds = 25 * 60;

    state.pomoIntervalId = setInterval(function () {
      if (state.pomoSeconds > 0) {
        state.pomoSeconds--;
        updatePomoDisplay();
      } else {
        if (state.pomoMode === 'focus') {
          state.pomoCycles++;
          state.pomoMode = 'rest';
          state.pomoSeconds = 5 * 60;
          if (PIP.toast) PIP.toast('⭐ Starlight Focus session complete! Take a 5m rest.');
        } else {
          state.pomoMode = 'focus';
          state.pomoSeconds = 25 * 60;
          if (PIP.toast) PIP.toast('✨ Rest interval complete! Ready for next session.');
        }
        if (PIP.audio && typeof PIP.audio.note === 'function' && PIP.audio.isOn && PIP.audio.isOn()) {
          try {
            PIP.audio.note(783.99, { dur: 0.3 });
          } catch (e) {}
        }
        updateUI();
      }
    }, 1000);

    updateUI();
  }

  function cancelPomodoro() {
    state.pomoMode = 'idle';
    state.pomoSeconds = 0;
    if (state.pomoIntervalId) {
      clearInterval(state.pomoIntervalId);
      state.pomoIntervalId = null;
    }
    updateUI();
  }

  var digitalDisplay = null;
  var handHour = null;
  var handMinute = null;
  var handSecond = null;
  var phaseBadge = null;
  var sleepDisplay = null;
  var pomoDisplay = null;
  var pomoCyclesEl = null;

  function updateTimerDisplay() {
    if (!sleepDisplay) {
      if (typeof document !== 'undefined') sleepDisplay = document.getElementById('clockSleepDisplay');
    }
    if (sleepDisplay) {
      sleepDisplay.textContent = formatSeconds(state.sleepTimerSeconds);
    }
  }

  function updatePomoDisplay() {
    if (!pomoDisplay) {
      if (typeof document !== 'undefined') pomoDisplay = document.getElementById('clockPomoDisplay');
    }
    if (pomoDisplay) {
      pomoDisplay.textContent = formatSeconds(state.pomoSeconds);
    }
  }

  function updateUI() {
    if (typeof document === 'undefined') return;

    updateTimerDisplay();
    updatePomoDisplay();

    if (!pomoCyclesEl) pomoCyclesEl = document.getElementById('clockPomoCycles');
    if (pomoCyclesEl) pomoCyclesEl.textContent = 'Completed: ' + state.pomoCycles;

    var sleepStartBtn = document.getElementById('clockSleepStartBtn');
    var sleepCancelBtn = document.getElementById('clockSleepCancelBtn');
    if (sleepStartBtn) sleepStartBtn.disabled = state.sleepTimerActive;
    if (sleepCancelBtn) sleepCancelBtn.disabled = !state.sleepTimerActive;

    var pomoStartBtn = document.getElementById('clockPomoStartBtn');
    var pomoCancelBtn = document.getElementById('clockPomoCancelBtn');
    if (pomoStartBtn) pomoStartBtn.disabled = (state.pomoMode !== 'idle');
    if (pomoCancelBtn) pomoCancelBtn.disabled = (state.pomoMode === 'idle');
  }

  function tick() {
    if (typeof document === 'undefined') return;

    if (!digitalDisplay) digitalDisplay = document.getElementById('clockDigital');
    if (!handHour) handHour = document.getElementById('clockHandHour');
    if (!handMinute) handMinute = document.getElementById('clockHandMinute');
    if (!handSecond) handSecond = document.getElementById('clockHandSecond');
    if (!phaseBadge) phaseBadge = document.getElementById('clockPhaseBadge');

    var now = new Date();
    if (digitalDisplay) {
      digitalDisplay.textContent = formatTime(now, state.is24h);
    }

    var angles = getHandAngles(now);
    if (handHour) handHour.setAttribute('transform', 'rotate(' + angles.hour + ' 100 100)');
    if (handMinute) handMinute.setAttribute('transform', 'rotate(' + angles.minute + ' 100 100)');
    if (handSecond) handSecond.setAttribute('transform', 'rotate(' + angles.second + ' 100 100)');

    if (phaseBadge) {
      phaseBadge.textContent = angles.isNight ? '🌙 Night' : '☀️ Day';
    }
  }

  function initUI() {
    if (typeof document === 'undefined') return;
    var win = document.getElementById('clockWin') || document.getElementById('clock');
    if (!win) return;

    var toggle24h = document.getElementById('clock24hToggle');
    if (toggle24h) {
      toggle24h.addEventListener('click', function () {
        state.is24h = !state.is24h;
        toggle24h.textContent = state.is24h ? '24H' : '12H';
        tick();
      });
    }

    var sleepPresetSelect = document.getElementById('clockSleepSelect');
    var sleepStartBtn = document.getElementById('clockSleepStartBtn');
    var sleepCancelBtn = document.getElementById('clockSleepCancelBtn');

    if (sleepStartBtn && sleepPresetSelect) {
      sleepStartBtn.addEventListener('click', function () {
        var m = parseInt(sleepPresetSelect.value, 10);
        startSleepTimer(m);
      });
    }

    if (sleepCancelBtn) {
      sleepCancelBtn.addEventListener('click', cancelSleepTimer);
    }

    var pomoStartBtn = document.getElementById('clockPomoStartBtn');
    var pomoCancelBtn = document.getElementById('clockPomoCancelBtn');

    if (pomoStartBtn) {
      pomoStartBtn.addEventListener('click', startPomodoro);
    }

    if (pomoCancelBtn) {
      pomoCancelBtn.addEventListener('click', cancelPomodoro);
    }

    tick();
    setInterval(tick, 1000);
    updateUI();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initUI);
    } else {
      initUI();
    }
  }

  var api = {
    formatTime: formatTime,
    formatSeconds: formatSeconds,
    getHandAngles: getHandAngles,
    startSleepTimer: startSleepTimer,
    cancelSleepTimer: cancelSleepTimer,
    startPomodoro: startPomodoro,
    cancelPomodoro: cancelPomodoro,
    getState: function () {
      return {
        is24h: state.is24h,
        sleepTimerActive: state.sleepTimerActive,
        sleepTimerSeconds: state.sleepTimerSeconds,
        pomoMode: state.pomoMode,
        pomoSeconds: state.pomoSeconds,
        pomoCycles: state.pomoCycles
      };
    }
  };

  PIP.clock = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
