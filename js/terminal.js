/* terminal.js: Pip's Midnight Interactive Terminal Shell (pip-term.exe)
   A retro CRT command-line shell with command history, tab auto-completion,
   system diagnostics, theme controls, sound player, and wish poster. */
(function () {
  'use strict';

  var PIP = (typeof window !== 'undefined' && window.PIP) ? window.PIP : {};
  function $(sel, root) {
    if (typeof window !== 'undefined' && window.PIP && window.PIP.$) return window.PIP.$(sel, root);
    if (typeof document !== 'undefined') {
      if (sel.indexOf('#') === 0 && sel.indexOf(' ') === -1 && sel.indexOf('.') === -1) {
        return document.getElementById(sel.slice(1));
      }
      return (root || document).querySelector(sel);
    }
    return null;
  }
  function $$(sel, root) {
    if (typeof window !== 'undefined' && window.PIP && window.PIP.$$) return window.PIP.$$(sel, root);
    if (typeof document !== 'undefined') {
      return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    }
    return [];
  }
  var store = PIP.store || { get: function () { return ''; }, set: function () {} };
  var audio = PIP.audio || { isOn: function () { return false; }, toggle: function () {}, note: function () {}, pop: function () {}, SCALE: [523, 659, 784] };
  var toast = PIP.toast || function () {};

  var COMMANDS = [
    'help', 'whoami', 'time', 'date', 'theme', 'sound', 'quiet',
    'play', 'wish', 'fortune', 'dream', 'calc', 'blocks', 'clear', 'history'
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

  function getPIP() {
    if (typeof window !== 'undefined' && window.PIP) return window.PIP;
    if (typeof global !== 'undefined' && global.PIP) return global.PIP;
    return PIP;
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
          "  blocks snapshot    - Capture and download PNG of current block tower",
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
          var tuneType = (args[0] || '').toLowerCase();
          if (tuneType === 'lullaby') {
            audio.note(audio.SCALE[0], { dur: 1.2, gain: 0.18 });
            audio.note(audio.SCALE[2], { dur: 1.2, gain: 0.16, when: 0.25 });
            audio.note(audio.SCALE[4], { dur: 1.4, gain: 0.15, when: 0.5 });
            audio.note(audio.SCALE[3], { dur: 1.6, gain: 0.14, when: 0.75 });
            out = "♪ Playing gentle nursery lullaby melody...";
          } else {
            audio.note(audio.SCALE[0], { dur: 0.6, gain: 0.2 });
            audio.note(audio.SCALE[2], { dur: 0.8, gain: 0.18, when: 0.12 });
            audio.note(audio.SCALE[4], { dur: 1.0, gain: 0.16, when: 0.24 });
            out = "♪ Playing C-pentatonic starlight chime...";
          }
        } else {
          out = "Sound is currently muted. Type 'sound on' or click speaker up top.";
        }
        break;

      case 'wish':
        if (args.length === 0) {
          out = "Usage: wish <your dream or wish>";
        } else {
          var wishText = args.join(' ');
          var wishObj = { n: 'terminal.exe', w: wishText, t: Date.now() };
          var p = getPIP();
          if (p && p.fx && typeof p.fx.saveLocalWish === 'function') {
            p.fx.saveLocalWish(wishObj);
          }
          if (p && p.stickers && typeof p.stickers.unlock === 'function') {
            p.stickers.unlock('wish');
          }
          out = "✨ Wish pinned to Midnight Wish Wall: \"" + wishText + "\"";
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

      case 'blocks':
        var sub = (args[0] || '').toLowerCase();
        if (sub === 'snapshot') {
          var cv = typeof document !== 'undefined' ? document.getElementById('blockCanvas') : null;
          var p = getPIP();
          var toys = (p && p.toys) ? p.toys : (PIP.toys || {});
          if (cv && typeof toys.downloadCanvas === 'function') {
            toys.downloadCanvas(cv, 'pip-blocks-snapshot.png');
            out = "📸 Stacking tower snapshot captured and downloaded!";
          } else {
            out = "blocks snapshot: canvas or snapshot exporter unavailable";
          }
        } else {
          out = "Usage: blocks snapshot";
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

  var PARAM_HINTS = {
    blocks: {
      params: ['stats', 'export'],
      hint: ' [stats|export]',
      pills: ['blocks stats', 'blocks export']
    },
    theme: {
      params: ['day', 'night', 'contrast'],
      hint: ' [day|night|contrast]',
      pills: ['theme day', 'theme night', 'theme contrast']
    },
    sound: {
      params: ['on', 'off', 'toggle'],
      hint: ' [on|off|toggle]',
      pills: ['sound on', 'sound off', 'sound toggle']
    },
    play: {
      params: ['chime', 'lullaby'],
      hint: ' [chime|lullaby]',
      pills: ['play chime', 'play lullaby']
    },
    calc: {
      params: ['24 * 7', '12 * 8', '100 / 4', '2 ^ 8'],
      hint: ' <expr> (e.g. 24 * 7)',
      pills: ['calc 24 * 7', 'calc 12 * 8', 'calc 100 / 4', 'calc 2 ^ 8']
    },
    wish: {
      params: ['Sweet dreams Pip', 'Good night nursery'],
      hint: ' <your wish>',
      pills: ['wish Sweet dreams Pip', 'wish Good night nursery']
    },
    quiet: {
      params: ['on', 'off'],
      hint: ' [on|off]',
      pills: ['quiet on', 'quiet off']
    },
    blocks: {
      params: ['snapshot'],
      hint: ' [snapshot]',
      pills: ['blocks snapshot']
    }
  };

  function autocomplete(prefix) {
    if (!prefix) return [];
    var p = prefix.toLowerCase();
    var trimmed = prefix.trim();
    var parts = trimmed.split(/\s+/);

    if (parts.length > 1 || (prefix.indexOf(' ') !== -1 && trimmed)) {
      var cmd = parts[0].toLowerCase();
      var argPrefix = parts.slice(1).join(' ').toLowerCase();
      if (PARAM_HINTS[cmd]) {
        var subMatches = PARAM_HINTS[cmd].params.filter(function (param) {
          return !argPrefix || param.toLowerCase().indexOf(argPrefix) === 0;
        });
        return subMatches.map(function (param) {
          return cmd + ' ' + param;
        });
      }
      return [];
    }

    return COMMANDS.filter(function (c) {
      return c.indexOf(p) === 0;
    });
  }

  function initTerminal() {
    var win = $('#terminal');
    if (!win) return;

    var screen = $('#termScreen');
    var input = $('#termInput');
    var ghost = $('#termGhost');
    var suggestions = $('#termSuggestions');
    if (!screen || !input) return;

    var tabMatches = [];
    var tabIndex = -1;
    var lastTabVal = '';

    function resetTabCycle() {
      tabMatches = [];
      tabIndex = -1;
      lastTabVal = '';
    }

    function setCursorEnd(el) {
      if (!el) return;
      var len = el.value ? el.value.length : 0;
      if (typeof el.setSelectionRange === 'function') {
        el.setSelectionRange(len, len);
      }
    }

    function appendLine(text, isCmd) {
      var line = document.createElement('div');
      line.className = isCmd ? 'term-line-cmd' : 'term-line-out';
      line.textContent = text;
      screen.appendChild(line);
      screen.scrollTop = screen.scrollHeight;
    }

    function renderSuggestions(pills) {
      if (!suggestions) return;
      suggestions.innerHTML = '';
      if (!pills || pills.length === 0) {
        suggestions.classList.remove('has-pills');
        return;
      }

      suggestions.classList.add('has-pills');
      pills.forEach(function (pill) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'term-pill';
        btn.setAttribute('data-cmd', pill.text);
        btn.setAttribute('aria-label', 'Autocomplete command ' + pill.text);

        var txtSpan = document.createElement('span');
        txtSpan.className = 'term-pill-text';
        txtSpan.textContent = pill.text;
        btn.appendChild(txtSpan);

        if (pill.desc) {
          var descSpan = document.createElement('span');
          descSpan.className = 'term-pill-desc';
          descSpan.textContent = ' ' + pill.desc;
          btn.appendChild(descSpan);
        }

        btn.addEventListener('click', function (e) {
          e.preventDefault();
          input.value = pill.text + (PARAM_HINTS[pill.text] ? ' ' : '');
          input.focus();
          setCursorEnd(input);
          resetTabCycle();
          updateGhostAndSuggestions();
        });

        suggestions.appendChild(btn);
      });
    }

    function updateGhostAndSuggestions() {
      var val = input.value;
      var trimmed = val.trim();

      if (!trimmed) {
        if (ghost) ghost.innerHTML = '';
        renderSuggestions([
          { text: 'help', desc: 'manual' },
          { text: 'theme night', desc: 'theme' },
          { text: 'sound toggle', desc: 'audio' },
          { text: 'play chime', desc: 'melody' },
          { text: 'calc 24 * 7', desc: 'math' },
          { text: 'whoami', desc: 'profile' }
        ]);
        return;
      }

      var parts = trimmed.split(/\s+/);
      var cmd = parts[0].toLowerCase();
      var hasSpace = val.indexOf(' ') !== -1;
      var ghostHtml = '';
      var pills = [];

      if (!hasSpace) {
        var matches = COMMANDS.filter(function (c) {
          return c.indexOf(cmd) === 0;
        });

        if (matches.length > 0) {
          var bestMatch = matches[0];
          var remainder = bestMatch.slice(cmd.length);
          var hintSuffix = PARAM_HINTS[bestMatch] ? PARAM_HINTS[bestMatch].hint : '';
          ghostHtml = '<span class="term-ghost-typed">' + sanitize(val) + '</span><span class="term-ghost-rest">' + sanitize(remainder + hintSuffix) + '</span>';

          if (matches.length === 1 && matches[0] === cmd && PARAM_HINTS[cmd]) {
            pills = PARAM_HINTS[cmd].pills.map(function (p) { return { text: p, desc: '' }; });
          } else {
            pills = matches.map(function (m) {
              return { text: m, desc: PARAM_HINTS[m] ? PARAM_HINTS[m].hint.trim() : '' };
            });
          }
        }
      } else {
        if (PARAM_HINTS[cmd]) {
          var argPrefix = parts.slice(1).join(' ').toLowerCase();
          var subMatches = PARAM_HINTS[cmd].params.filter(function (p) {
            return !argPrefix || p.toLowerCase().indexOf(argPrefix) === 0;
          });

          if (subMatches.length > 0) {
            var firstSub = subMatches[0];
            var typedArg = parts.slice(1).join(' ');
            var subRemainder = firstSub.slice(typedArg.length);
            ghostHtml = '<span class="term-ghost-typed">' + sanitize(val) + '</span><span class="term-ghost-rest">' + sanitize(subRemainder) + '</span>';

            pills = subMatches.map(function (s) {
              return { text: cmd + ' ' + s, desc: '' };
            });
          }
        }
      }

      if (ghost) ghost.innerHTML = ghostHtml;
      renderSuggestions(pills);
    }

    input.addEventListener('input', function () {
      resetTabCycle();
      updateGhostAndSuggestions();
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        var rawVal = input.value;

        if (tabMatches.length > 0 && rawVal === lastTabVal) {
          if (e.shiftKey) {
            tabIndex = (tabIndex - 1 + tabMatches.length) % tabMatches.length;
          } else {
            tabIndex = (tabIndex + 1) % tabMatches.length;
          }
        } else {
          var trimmedVal = rawVal.trim();
          if (!trimmedVal) {
            tabMatches = COMMANDS.slice();
          } else {
            var m = autocomplete(rawVal);
            if (m.length === 1 && m[0] === trimmedVal && PARAM_HINTS[trimmedVal.toLowerCase()]) {
              tabMatches = PARAM_HINTS[trimmedVal.toLowerCase()].pills.slice();
            } else if (m.length > 0) {
              tabMatches = m;
            } else {
              tabMatches = [];
            }
          }
          tabIndex = e.shiftKey ? (tabMatches.length - 1) : 0;
        }

        if (tabMatches.length > 0) {
          var chosen = tabMatches[tabIndex];
          input.value = chosen;
          lastTabVal = chosen;
          setCursorEnd(input);
          updateGhostAndSuggestions();
        }
        return;
      }

      if (e.key !== 'Shift') {
        resetTabCycle();
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        var val = input.value;
        if (!val.trim()) return;

        appendLine('pip@midnight:~$ ' + val, true);
        var res = executeCommand(val);
        input.value = '';
        resetTabCycle();
        updateGhostAndSuggestions();

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
          setCursorEnd(input);
          updateGhostAndSuggestions();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
          historyIndex++;
          input.value = history[historyIndex];
          setCursorEnd(input);
          updateGhostAndSuggestions();
        } else {
          historyIndex = history.length;
          input.value = '';
          setCursorEnd(input);
          updateGhostAndSuggestions();
        }
      }
    });

    // Initial render of suggestions on boot
    updateGhostAndSuggestions();

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
    COMMANDS: COMMANDS,
    PARAM_HINTS: PARAM_HINTS
  };

  PIP.terminal = terminalAPI;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = terminalAPI;
  }
})();
