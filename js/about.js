/* about.js: About PipOS System Info & GPU Benchmark (pip-about.exe)
   Provides hardware/browser diagnostic introspection, JS heap memory usage,
   WebGL GPU renderer identification, and an interactive canvas particle benchmark. */
(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
  var PIP = root.PIP || {};
  root.PIP = PIP;

  function getGpuInfo() {
    if (typeof document === 'undefined') return 'Virtual Test GPU';
    try {
      var canvas = document.createElement('canvas');
      var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'Software Canvas';
      var dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) {
        return gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || 'WebGL Renderer';
      }
      return gl.getParameter(gl.RENDERER) || 'Generic WebGL';
    } catch (e) {
      return 'Generic Hardware Accelerated GPU';
    }
  }

  function getMemoryInfo() {
    if (typeof root.performance !== 'undefined' && root.performance.memory) {
      var mem = root.performance.memory;
      return {
        usedMB: (mem.usedJSHeapSize / (1024 * 1024)).toFixed(1),
        totalMB: (mem.totalJSHeapSize / (1024 * 1024)).toFixed(1),
        limitMB: (mem.jsHeapSizeLimit / (1024 * 1024)).toFixed(1),
        supported: true
      };
    }
    return {
      usedMB: 'N/A',
      totalMB: 'N/A',
      limitMB: 'N/A',
      supported: false
    };
  }

  function getSysInfo() {
    var nav = (typeof root.navigator !== 'undefined') ? root.navigator : {};
    var screen = (typeof root.screen !== 'undefined') ? root.screen : { width: 1024, height: 768, colorDepth: 24 };

    return {
      osName: 'pipOS 1.0 (Starlight Edition)',
      kernel: 'Vanilla Web Engine (Zero-Runtime)',
      platform: nav.platform || 'Web Standard',
      language: nav.language || 'en-US',
      screenRes: (root.innerWidth || screen.width) + ' × ' + (root.innerHeight || screen.height),
      dpr: (root.devicePixelRatio || 1).toFixed(1),
      colorDepth: (screen.colorDepth || 24) + '-bit',
      gpu: getGpuInfo(),
      memory: getMemoryInfo(),
      cores: nav.hardwareConcurrency || 4
    };
  }

  function getBenchmarkRating(fps) {
    if (fps >= 55) return { grade: 'Blazing', stars: '★★★', desc: 'Silky smooth 60 FPS performance' };
    if (fps >= 40) return { grade: 'Swift', stars: '★★☆', desc: 'Great responsive rendering' };
    return { grade: 'Cozy', stars: '★☆☆', desc: 'Gentle power-saving pace' };
  }

  function getDiagnosticsReport() {
    var info = getSysInfo();
    return [
      '### PipOS System Diagnostics Report',
      '- **OS:** ' + info.osName,
      '- **Engine:** ' + info.kernel,
      '- **Platform:** ' + info.platform,
      '- **Language:** ' + info.language,
      '- **Screen:** ' + info.screenRes + ' (DPR: ' + info.dpr + ', ' + info.colorDepth + ')',
      '- **GPU:** ' + info.gpu,
      '- **CPU Cores:** ' + info.cores,
      '- **JS Heap Used:** ' + info.memory.usedMB + ' MB / ' + info.memory.totalMB + ' MB'
    ].join('\n');
  }

  // Particle Benchmark State
  var benchState = {
    running: false,
    particles: [],
    frameCount: 0,
    startTime: 0,
    fps: 60,
    animId: null
  };

  function initParticles(count, w, h) {
    var pts = [];
    for (var i = 0; i < count; i++) {
      pts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 2 + 1,
        color: i % 2 === 0 ? '#ffa6c4' : '#ffd98a'
      });
    }
    return pts;
  }

  function startBenchmark(onDone) {
    if (typeof document === 'undefined') {
      if (onDone) onDone({ fps: 60, rating: getBenchmarkRating(60) });
      return;
    }
    var canvas = document.getElementById('benchCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    benchState.running = true;
    benchState.frameCount = 0;
    benchState.startTime = performance.now();
    benchState.particles = initParticles(1000, canvas.width, canvas.height);

    function frame(t) {
      if (!benchState.running) return;

      var w = canvas.width;
      var h = canvas.height;
      ctx.fillStyle = '#1b1430';
      ctx.fillRect(0, 0, w, h);

      var pts = benchState.particles;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      benchState.frameCount++;
      var elapsed = (t - benchState.startTime) / 1000;

      // Update FPS display live
      if (elapsed > 0.5) {
        benchState.fps = Math.round(benchState.frameCount / elapsed);
        var fpsEl = document.getElementById('benchFpsLive');
        if (fpsEl) fpsEl.textContent = benchState.fps + ' FPS';
      }

      // Finish after 3 seconds of benchmark
      if (elapsed >= 3.0) {
        benchState.running = false;
        var finalFps = Math.round(benchState.frameCount / elapsed);
        var res = {
          fps: finalFps,
          rating: getBenchmarkRating(finalFps)
        };
        if (onDone) onDone(res);
        return;
      }

      benchState.animId = root.requestAnimationFrame(frame);
    }

    benchState.animId = root.requestAnimationFrame(frame);
  }

  function stopBenchmark() {
    benchState.running = false;
    if (benchState.animId && typeof root.cancelAnimationFrame === 'function') {
      root.cancelAnimationFrame(benchState.animId);
      benchState.animId = null;
    }
  }

  function initUI() {
    if (typeof document === 'undefined') return;
    var win = document.getElementById('sysInfo') || document.getElementById('about');
    if (!win) return;

    var info = getSysInfo();

    var setEl = function (id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setEl('aboutOsName', info.osName);
    setEl('aboutKernel', info.kernel);
    setEl('aboutPlatform', info.platform);
    setEl('aboutScreen', info.screenRes + ' (' + info.dpr + 'x DPR)');
    setEl('aboutGpu', info.gpu);
    setEl('aboutCores', info.cores + ' Logical Cores');
    setEl('aboutMemory', info.memory.supported ? (info.memory.usedMB + ' MB used / ' + info.memory.totalMB + ' MB') : 'Managed Browser Memory');

    var copyBtn = document.getElementById('aboutCopyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var report = getDiagnosticsReport();
        if (root.navigator && root.navigator.clipboard && root.navigator.clipboard.writeText) {
          root.navigator.clipboard.writeText(report).then(function () {
            if (PIP.toast) PIP.toast('System diagnostics copied to clipboard!');
          });
        } else {
          if (PIP.toast) PIP.toast('Report generated in console.');
          console.log(report);
        }
      });
    }

    var startBenchBtn = document.getElementById('aboutStartBenchBtn');
    var benchResultBox = document.getElementById('aboutBenchResult');

    if (startBenchBtn) {
      startBenchBtn.addEventListener('click', function () {
        startBenchBtn.disabled = true;
        startBenchBtn.textContent = 'Benchmarking...';
        if (benchResultBox) benchResultBox.textContent = 'Running 1,000 particle stress test...';

        startBenchmark(function (res) {
          startBenchBtn.disabled = false;
          startBenchBtn.textContent = 'Rerun Benchmark';
          if (benchResultBox) {
            benchResultBox.textContent = res.fps + ' FPS (' + res.rating.grade + ' ' + res.rating.stars + ' - ' + res.rating.desc + ')';
          }
          if (PIP.toast) {
            PIP.toast('Benchmark Complete: ' + res.fps + ' FPS (' + res.rating.grade + ')');
          }
        });
      });
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
    getSysInfo: getSysInfo,
    getGpuInfo: getGpuInfo,
    getMemoryInfo: getMemoryInfo,
    getBenchmarkRating: getBenchmarkRating,
    getDiagnosticsReport: getDiagnosticsReport,
    startBenchmark: startBenchmark,
    stopBenchmark: stopBenchmark
  };

  PIP.about = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
