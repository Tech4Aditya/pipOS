/* terminal.js: Pip's Midnight Interactive Terminal Shell (pip-term.exe)
   A retro CRT command-line shell with command history, tab auto-completion,
   system diagnostics, theme controls, sound player, and wish poster. */
(function () {
  'use strict';

  var PIP = (typeof window !== 'undefined' && window.PIP) ? window.PIP : {};
  var $ = PIP.$ || function () { return null; };
  var $$ = PIP.$$ || function () { return []; };
  var store = PIP.store || { get: function () { return ''; }, set: function () {} };
  var audio = PIP.audio || { isOn: function () { return false; }, toggle: function () {}, note: function () {}, pop: function () {}, SCALE: [523, 659, 784] };
  var toast = PIP.toast || function () {};

  var COMMANDS = [
    'help', 'whoami', 'time', 'date', 'theme', 'sound', 'quiet',
    'play', 'wish', 'fortune', 'dream', 'calc', 'clear', 'history'
  ];

  var FORTUNES = [
    "A star falls only when a dreamer needs a bedtime flashlight.",
    "The quieter the nursery, the sweeter the dream delivery.",
    "If your blocks tumble, build the next tower into a moon staircase.",
    "Behind every closed attic door, a lost music box is humming.",
    "Sleep is the gentle machine that rewinds tomorrow's wonders."
  ];

  var history = [];
  var historyIndex = -1;

  function sanitize(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getMoonPhase() {
    var phases = ['New Moon 🌑', 'Waxing Crescent 🌒', 'First Quarter 🌓', 'Waxing Gibbous 🌔', 'Full Moon 🌕', 'Waning Gibbous 🌖', 'Last Quarter 🌗', 'Waning Crescent 🌘'];
    var day = new Date().getDate();
    return phases[day % phases.length];
  }

  function executeCommand(input) {
    var raw = input ? input.trim() : '';
    if (!raw) return { ok: true, output: '' };

    history.push(raw);
    historyIndex = history.length;

    var parts = raw.split(/\s+/);
    var cmd = parts[0].toLowerCase();
    var args = parts.slice(1);
    var out = '';

    switch (cmd) {
      case 'help':
        out = [
          "PipOS Midnight Shell v1.0 — Available Commands:",
          "  help               - Show this manual",
          "  whoami             - Display Pip's credentials & profile",
          "  time / date        - Display nursery clock and moon phase",
          "  theme [t]          - Get or set theme ('day', 'night', 'contrast')",
          "  sound [on|off]     - Check or toggle audio synthesizer",
          "  quiet [on|off]     - Check or toggle quiet mode",
          "  play [chime|lullaby] - Synthesize Web Audio melody",
          "  wish <text>        - Post a wish to the wish wall",
          "  fortune / dream    - Read a midnight prophecy",
          "  calc <expr>        - Quick arithmetic evaluator (e.g., calc 24 * 7)",
          "  history            - Display recent command history",
          "  clear              - Wipe terminal screen"
        ].join('\n');
        break;

      case 'whoami':
        out = [
          "User: Pip the Skull Baby (UID: 001)",
          "Role: Chief Dream Engineer & Midnight Nursery Caretaker",
          "Canon: haX.baby / October 2026",
          "Mission: Putting the neighborhood to sleep one lullaby at a time."
        ].join('\n');
        break;

      case 'time':
      case 'date':
        var now = new Date();
        out = "Nursery Time: " + now.toLocaleTimeString() + " | " + now.toLocaleDateString() + "\nLunar Cycle: " + getMoonPhase();
        break;

      case 'theme':
        if (args.length === 0) {
          out = "Current desktop theme: " + (store.get('theme', 'day')) + (store.get('contrast', '') === 'on' ? ' (high contrast)' : '');
        } else {
          var target = args[0].toLowerCase();
          if (['day', 'night'].includes(target)) {
            var themeBtn = typeof document !== 'undefined' ? document.getElementById('themeBtn') : null;
            var current = (typeof document !== 'undefined' && document.documentElement)
              ? (document.documentElement.getAttribute('data-theme') || store.get('theme', 'day'))
              : store.get('theme', 'day');
            store.set('theme', target);
            if (typeof document !== 'undefined' && document.documentElement) {
              document.documentElement.setAttribute('data-theme', target);
            }
            if (current !== target && themeBtn) themeBtn.click();
            out = "Theme switched to " + target + " mode 🌙";
          } else if (target === 'contrast') {
            var cBtn = document.getElementById('contrastBtn');
            if (cBtn) cBtn.click();
            out = "Contrast mode toggled.";
          } else {
            out = "Usage: theme [day|night|contrast]";
          }
        }
        break;

      case 'sound':
        if (args.length === 0) {
          out = "Sound state: " + (audio.isOn() ? 'ON 🔊' : 'OFF 🔇');
        } else {
          var s = args[0].toLowerCase();
          if (s === 'on' && !audio.isOn()) audio.toggle();
          else if (s === 'off' && audio.isOn()) audio.toggle();
          else if (s === 'toggle') audio.toggle();
          out = "Sound state is now: " + (audio.isOn() ? 'ON 🔊' : 'OFF 🔇');
        }
        break;

      case 'quiet':
        var qBtn = document.getElementById('quietBtn');
        if (qBtn) qBtn.click();
        out = "Quiet mode toggled.";
        break;

      case 'play':
        if (audio.isOn()) {
          audio.note(audio.SCALE[0], { dur: 0.6, gain: 0.2 });
          audio.note(audio.SCALE[2], { dur: 0.8, gain: 0.18, when: 0.12 });
          audio.note(audio.SCALE[4], { dur: 1.0, gain: 0.16, when: 0.24 });
          out = "♪ Playing C-pentatonic starlight chime...";
        } else {
          out = "Sound is currently muted. Type 'sound on' or click speaker up top.";
        }
        break;

      case 'wish':
        if (args.length === 0) {
          out = "Usage: wish <your dream or wish>";
        } else {
          var wishText = args.join(' ');
          if (PIP.wall && typeof PIP.wall.postWish === 'function') {
            PIP.wall.postWish({ name: 'terminal.exe', wish: wishText });
            out = "✨ Wish dispatched to Midnight Wish Wall: \"" + wishText + "\"";
          } else {
            out = "Wish saved: \"" + wishText + "\" (Wall offline)";
          }
        }
        break;

      case 'fortune':
      case 'dream':
        out = "⭐ Pip's Prophecy: " + FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
        break;

      case 'calc':
        if (args.length === 0) {
          out = "Usage: calc <number> <op> <number> (e.g., calc 12 * 4)";
        } else {
          var expr = args.join(' ');
          try {
            // Safe arithmetic tokenizer (no eval)
            var m = expr.match(/^(\d+(?:\.\d+)?)\s*([\+\-\*\/%^])\s*(\d+(?:\.\d+)?)$/);
            if (m) {
              var a = parseFloat(m[1]), o = m[2], b = parseFloat(m[3]), r = 0;
              if (o === '+') r = a + b;
              else if (o === '-') r = a - b;
              else if (o === '*') r = a * b;
              else if (o === '/') r = b === 0 ? 'Error (÷ 0)' : a / b;
              else if (o === '%') r = a % b;
              else if (o === '^') r = Math.pow(a, b);
              out = expr + " = " + r;
            } else {
              out = "calc: supported binary expressions: + - * / % ^";
            }
          } catch (e) {
            out = "calc error: invalid math expression";
          }
        }
        break;

      case 'history':
        out = history.map(function (h, i) { return (i + 1) + '  ' + h; }).join('\n');
        break;

      case 'clear':
        return { ok: true, clear: true, output: '' };

      default:
        out = "pip-sh: command not found: " + cmd + ". Type 'help' for instructions.";
    }

    return { ok: true, output: out };
  }

  function autocomplete(prefix) {
    if (!prefix) return [];
    var p = prefix.toLowerCase();
    return COMMANDS.filter(function (c) {
      return c.indexOf(p) === 0;
    });
  }

  function initTerminal() {
    var win = $('#terminal');
    if (!win) return;

    var screen = $('#termScreen');
    var input = $('#termInput');
    if (!screen || !input) return;

    function appendLine(text, isCmd) {
      var line = document.createElement('div');
      line.className = isCmd ? 'term-line-cmd' : 'term-line-out';
      line.textContent = text;
      screen.appendChild(line);
      screen.scrollTop = screen.scrollHeight;
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var val = input.value;
        if (!val.trim()) return;

        appendLine('pip@midnight:~$ ' + val, true);
        var res = executeCommand(val);
        input.value = '';

        if (res.clear) {
          screen.innerHTML = '';
        } else if (res.output) {
          appendLine(res.output, false);
        }

        if (audio.isOn()) audio.pop();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length > 0 && historyIndex > 0) {
          historyIndex--;
          input.value = history[historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
          historyIndex++;
          input.value = history[historyIndex];
        } else {
          historyIndex = history.length;
          input.value = '';
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        var val = input.value.trim();
        var matches = autocomplete(val);
        if (matches.length === 1) {
          input.value = matches[0] + ' ';
        } else if (matches.length > 1) {
          appendLine('pip@midnight:~$ ' + val, true);
          appendLine(matches.join('  '), false);
        }
      }
    });

    // Clicking anywhere in the terminal focuses the input prompt
    screen.parentElement.addEventListener('click', function () {
      input.focus();
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initTerminal);
    } else {
      initTerminal();
    }
  }

  var terminalAPI = {
    init: initTerminal,
    executeCommand: executeCommand,
    autocomplete: autocomplete,
    getHistory: function () { return history; },
    COMMANDS: COMMANDS
  };

  PIP.terminal = terminalAPI;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = terminalAPI;
  }
})();
