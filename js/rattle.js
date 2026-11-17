(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
  var PIP = root.PIP = root.PIP || {};

  var RATTLE_CONFIG = {
    SPRING_K: 0.14,
    DAMPING: 0.82,
    MASS: 1.0,
    SHAKE_THRESHOLD: 14.0, // Device motion threshold
    JINGLE_FREQS: [1760, 2217, 2793, 3520] // Soft bell chime frequencies
  };

  function playRattleJingle(intensity) {
    if (!PIP.audio || typeof PIP.audio.isOn !== 'function' || !PIP.audio.isOn()) return;

    var audioCtx = null;
    if (typeof PIP.audio.state === 'function') {
      // Audio is initialized in pipOS
    }

    // Use PIP.audio.note or web audio synthesis
    var scaleFactor = Math.min(Math.max(intensity || 0.5, 0.2), 1.0);

    if (typeof PIP.audio.note === 'function') {
      var noteIdx = Math.floor(Math.random() * RATTLE_CONFIG.JINGLE_FREQS.length);
      var f1 = RATTLE_CONFIG.JINGLE_FREQS[noteIdx];
      var f2 = RATTLE_CONFIG.JINGLE_FREQS[(noteIdx + 1) % RATTLE_CONFIG.JINGLE_FREQS.length];

      PIP.audio.note(f1, { dur: 0.12, gain: 0.12 * scaleFactor, type: 'triangle' });
      setTimeout(function () {
        if (PIP.audio && PIP.audio.isOn()) {
          PIP.audio.note(f2, { dur: 0.14, gain: 0.08 * scaleFactor, type: 'sine' });
        }
      }, 35);
    }
  }

  function updateSpring(state, dt) {
    if (!state) return;
    dt = dt || 1;

    // Angular spring
    var angForce = -RATTLE_CONFIG.SPRING_K * (state.angle - state.targetAngle) - (1 - RATTLE_CONFIG.DAMPING) * state.vAngle;
    state.vAngle += (angForce / RATTLE_CONFIG.MASS) * dt;
    state.vAngle *= RATTLE_CONFIG.DAMPING;
    state.angle += state.vAngle * dt;

    // Linear spring (X displacement)
    var xForce = -RATTLE_CONFIG.SPRING_K * (state.x - state.targetX) - (1 - RATTLE_CONFIG.DAMPING) * state.vx;
    state.vx += (xForce / RATTLE_CONFIG.MASS) * dt;
    state.vx *= RATTLE_CONFIG.DAMPING;
    state.x += state.vx * dt;

    // Linear spring (Y displacement)
    var yForce = -RATTLE_CONFIG.SPRING_K * (state.y - state.targetY) - (1 - RATTLE_CONFIG.DAMPING) * state.vy;
    state.vy += (yForce / RATTLE_CONFIG.MASS) * dt;
    state.vy *= RATTLE_CONFIG.DAMPING;
    state.y += state.vy * dt;

    // Trigger jingle on high acceleration/speed if not dragging
    if (!state.isDragging && (Math.abs(state.vAngle) > 0.06 || Math.abs(state.vx) > 3.0)) {
      var now = Date.now();
      if (now - state.lastJingle > 120) {
        state.lastJingle = now;
        playRattleJingle(Math.min(1.0, Math.abs(state.vAngle) * 3));
      }
    }
  }

  function initRattle() {
    var rattleWrap = document.getElementById('rattleToy');
    var rattleSvg = document.getElementById('rattleSvg');
    var shakeBtn = document.getElementById('rattleShakeBtn');
    var sensorToggle = document.getElementById('rattleSensorToggle');
    var sensorStatus = document.getElementById('rattleSensorStatus');

    if (!rattleWrap || !rattleSvg) return;

    var state = {
      angle: 0,
      vAngle: 0,
      targetAngle: 0,
      x: 0,
      vx: 0,
      targetX: 0,
      y: 0,
      vy: 0,
      targetY: 0,
      isDragging: false,
      lastJingle: 0,
      dragStartX: 0,
      dragStartY: 0,
      sensorEnabled: false,
      lastMotion: { x: 0, y: 0, z: 0 },
      rafId: 0
    };

    function applyTransforms() {
      rattleSvg.style.transform = 'translate(' + state.x.toFixed(1) + 'px, ' + state.y.toFixed(1) + 'px) rotate(' + (state.angle * (180 / Math.PI)).toFixed(1) + 'deg)';
    }

    function animate() {
      if (!state.isDragging) {
        updateSpring(state, 1);
        applyTransforms();
      }
      state.rafId = requestAnimationFrame(animate);
    }

    function shakeImpulse(force) {
      force = force || 1;
      state.vAngle += (Math.random() > 0.5 ? 0.35 : -0.35) * force;
      state.vx += (Math.random() - 0.5) * 24 * force;
      state.vy += -16 * force;
      playRattleJingle(0.8 * force);
    }

    // Drag interactions
    rattleSvg.addEventListener('pointerdown', function (e) {
      state.isDragging = true;
      state.dragStartX = e.clientX - state.x;
      state.dragStartY = e.clientY - state.y;
      try { rattleSvg.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });

    rattleSvg.addEventListener('pointermove', function (e) {
      if (!state.isDragging) return;
      var curX = e.clientX - state.dragStartX;
      var curY = e.clientY - state.dragStartY;

      // Clamp max displacement
      state.x = Math.max(-80, Math.min(80, curX));
      state.y = Math.max(-60, Math.min(60, curY));
      state.angle = (state.x / 80) * 0.45;

      applyTransforms();

      // Jingle while shaking rapidly during drag
      var now = Date.now();
      if (now - state.lastJingle > 160) {
        state.lastJingle = now;
        playRattleJingle(0.4);
      }
    });

    function endDrag(e) {
      if (!state.isDragging) return;
      state.isDragging = false;
      try { rattleSvg.releasePointerCapture(e.pointerId); } catch (err) {}
      // Release spring with angular snap
      state.vAngle = -state.angle * 0.6;
      state.vx = -state.x * 0.4;
      state.vy = -state.y * 0.4;
      playRattleJingle(0.9);
    }

    rattleSvg.addEventListener('pointerup', endDrag);
    rattleSvg.addEventListener('pointercancel', endDrag);

    // Keyboard accessibility
    rattleSvg.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') {
        shakeImpulse(1.2);
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        state.vAngle -= 0.3;
        state.vx -= 15;
        playRattleJingle(0.6);
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        state.vAngle += 0.3;
        state.vx += 15;
        playRattleJingle(0.6);
        e.preventDefault();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        state.vy -= 18;
        shakeImpulse(0.8);
        e.preventDefault();
      }
    });

    if (shakeBtn) {
      shakeBtn.addEventListener('click', function () {
        shakeImpulse(1.4);
      });
    }

    // Motion Sensor Opt-In handling
    function handleDeviceMotion(e) {
      if (!state.sensorEnabled) return;
      var acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc) return;

      var dx = Math.abs(acc.x - state.lastMotion.x);
      var dy = Math.abs(acc.y - state.lastMotion.y);
      var dz = Math.abs(acc.z - state.lastMotion.z);
      var totalDelta = dx + dy + dz;

      state.lastMotion.x = acc.x || 0;
      state.lastMotion.y = acc.y || 0;
      state.lastMotion.z = acc.z || 0;

      if (totalDelta > RATTLE_CONFIG.SHAKE_THRESHOLD) {
        var forceRatio = Math.min(2.0, totalDelta / RATTLE_CONFIG.SHAKE_THRESHOLD);
        shakeImpulse(forceRatio);
      }
    }

    if (sensorToggle) {
      sensorToggle.addEventListener('click', function () {
        if (state.sensorEnabled) {
          // Disable sensor
          state.sensorEnabled = false;
          window.removeEventListener('devicemotion', handleDeviceMotion);
          sensorToggle.setAttribute('aria-pressed', 'false');
          sensorToggle.textContent = 'Enable Shake Sensor';
          if (sensorStatus) sensorStatus.textContent = 'Sensor: Off';
          return;
        }

        // Permission request for iOS 13+ devices
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
          DeviceMotionEvent.requestPermission().then(function (permissionState) {
            if (permissionState === 'granted') {
              enableSensor();
            } else {
              if (sensorStatus) sensorStatus.textContent = 'Sensor: Permission Denied';
            }
          }).catch(function () {
            if (sensorStatus) sensorStatus.textContent = 'Sensor: Not Supported';
          });
        } else if ('ondevicemotion' in window) {
          enableSensor();
        } else {
          if (sensorStatus) sensorStatus.textContent = 'Sensor: Not Supported on this device';
        }
      });
    }

    function enableSensor() {
      state.sensorEnabled = true;
      window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
      if (sensorToggle) {
        sensorToggle.setAttribute('aria-pressed', 'true');
        sensorToggle.textContent = 'Disable Shake Sensor';
      }
      if (sensorStatus) sensorStatus.textContent = 'Sensor: Active (shake phone)';
    }

    state.rafId = requestAnimationFrame(animate);

    return {
      state: state,
      shakeImpulse: shakeImpulse,
      enableSensor: enableSensor
    };
  }

  PIP.rattle = {
    init: initRattle,
    updateSpring: updateSpring,
    playJingle: playRattleJingle,
    CONFIG: RATTLE_CONFIG
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      updateSpring: updateSpring,
      playRattleJingle: playRattleJingle,
      RATTLE_CONFIG: RATTLE_CONFIG,
      initRattle: initRattle
    };
  }
})();
