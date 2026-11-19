/* calc.js: Pip's Starlight Scientific & Nursery Calculator (starlight-calc.exe)
   A retro LCD scientific calculator featuring standard arithmetic, trigonometry,
   logarithms, bracket parsing, memory registers, sheep counter Easter egg, and pentatonic audio chime feedback.
   See technical documentation & parser specification in docs/CALCULATOR_ENGINE.md. */
(function () {
  'use strict';

  var PIP = (typeof window !== 'undefined' && window.PIP) ? window.PIP : {};
  var $ = PIP.$ || function (sel) { return typeof document !== 'undefined' ? document.querySelector(sel) : null; };
  var audio = PIP.audio || { isOn: function () { return false; }, note: function () { }, pop: function () { }, SCALE: [523, 587, 659, 784, 880, 1046, 1175, 1318] };
  var toast = PIP.toast || function () { };

  var state = {
    display: '0',
    expression: '',
    memory: 0,
    hasMemory: false,
    isRadian: false,
    chimesEnabled: true,
    sheepCount: 0,
    resetNext: false
  };

  var audioCtx = null;
  function getAudioContext() {
    if (!audioCtx && typeof window !== 'undefined') {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    return audioCtx;
  }

  function playKeyTone(key) {
    if (!state.chimesEnabled) return;

    if (audio.isOn && audio.isOn()) {
      if (typeof key === 'number' || /^[0-9]$/.test(key)) {
        var noteIdx = parseInt(key, 10) % (audio.SCALE.length || 8);
        audio.note(audio.SCALE[noteIdx], { dur: 0.25, gain: 0.12 });
      } else if (key === '=') {
        audio.note(audio.SCALE[0], { dur: 0.4, gain: 0.14 });
        audio.note(audio.SCALE[4], { dur: 0.5, gain: 0.14, when: 0.08 });
        audio.note(audio.SCALE[7], { dur: 0.7, gain: 0.16, when: 0.16 });
      } else if (key === 'C' || key === 'AC') {
        audio.pop();
      } else {
        audio.note(audio.SCALE[2], { dur: 0.25, gain: 0.10 });
      }
      return;
    }

    try {
      var ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';

      var freq = 659.25; // E5 default chime
      var duration = 0.15;

      if (typeof key === 'number' || /^[0-9]$/.test(key)) {
        var freqs = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1396.91, 1567.98];
        freq = freqs[parseInt(key, 10) % freqs.length];
      } else if (key === '=') {
        freq = 1046.5; // C6
        duration = 0.35;
      } else if (key === 'AC' || key === 'C') {
        freq = 349.23; // F4
        duration = 0.08;
      } else if (key === '(' || key === ')') {
        freq = 880.0; // A5
      }

      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio playback fails safely without throwing
    }
  }

  function factorial(n) {
    if (n < 0 || n > 170 || Math.floor(n) !== n) return NaN;
    if (n === 0 || n === 1) return 1;
    var res = 1;
    for (var i = 2; i <= n; i++) res *= i;
    return res;
  }

  function evaluateExpression(exprStr, isRadian) {
    if (!exprStr || typeof exprStr !== 'string') return '0';
    var s = exprStr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').trim();

    var tokenRegex = /\s*([0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?|[a-zA-Z]+|[+\-*/%^!()πe]|.)\s*/g;
    var tokens = [];
    var match;
    while ((match = tokenRegex.exec(s)) !== null) {
      var t = match[1];
      if (t) tokens.push(t);
    }

    if (!tokens.length) return '0';

    var prec = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 3, 'u-': 4 };
    var assoc = { '+': 'L', '-': 'L', '*': 'L', '/': 'L', '%': 'L', '^': 'R', 'u-': 'R' };

    var output = [];
    var ops = [];
    var prevToken = null;

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];

      if (/^[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/.test(token)) {
        output.push({ type: 'num', value: parseFloat(token) });
      } else if (token === 'π' || token.toLowerCase() === 'pi') {
        output.push({ type: 'num', value: Math.PI });
      } else if (token === 'e' && (prevToken === null || /[+\-*/%^!(]/.test(prevToken))) {
        output.push({ type: 'num', value: Math.E });
      } else if (/^(sin|cos|tan|log|ln|sqrt|cbrt|abs)$/i.test(token)) {
        ops.push({ type: 'fn', value: token.toLowerCase() });
      } else if (token === '!') {
        output.push({ type: 'postfix', value: '!' });
      } else if (token === '(') {
        ops.push({ type: 'paren', value: '(' });
      } else if (token === ')') {
        while (ops.length && ops[ops.length - 1].value !== '(') {
          output.push(ops.pop());
        }
        if (!ops.length) return 'Syntax Error';
        ops.pop();
        if (ops.length && ops[ops.length - 1].type === 'fn') {
          output.push(ops.pop());
        }
      } else if (['+', '-', '*', '/', '%', '^'].indexOf(token) !== -1) {
        if (token === '-' && (prevToken === null || /[+\-*/%^!(]/.test(prevToken))) {
          token = 'u-';
        }
        while (
          ops.length &&
          ops[ops.length - 1].value !== '(' &&
          ((assoc[token] === 'L' && prec[token] <= prec[ops[ops.length - 1].value]) ||
            (assoc[token] === 'R' && prec[token] < prec[ops[ops.length - 1].value]))
        ) {
          output.push(ops.pop());
        }
        ops.push({ type: 'op', value: token });
      } else {
        return 'Syntax Error';
      }
      prevToken = token;
    }

    while (ops.length) {
      var top = ops.pop();
      if (top.value === '(') return 'Syntax Error';
      output.push(top);
    }

    var stack = [];
    for (var k = 0; k < output.length; k++) {
      var item = output[k];
      if (item.type === 'num') {
        stack.push(item.value);
      } else if (item.type === 'postfix' && item.value === '!') {
        if (!stack.length) return 'Syntax Error';
        stack.push(factorial(stack.pop()));
      } else if (item.type === 'fn') {
        if (!stack.length) return 'Syntax Error';
        var val = stack.pop();
        var fRes = 0;
        switch (item.value) {
          case 'sin': fRes = isRadian ? Math.sin(val) : Math.sin(val * Math.PI / 180); break;
          case 'cos': fRes = isRadian ? Math.cos(val) : Math.cos(val * Math.PI / 180); break;
          case 'tan': fRes = isRadian ? Math.tan(val) : Math.tan(val * Math.PI / 180); break;
          case 'sqrt': fRes = val < 0 ? NaN : Math.sqrt(val); break;
          case 'cbrt': fRes = Math.cbrt(val); break;
          case 'log': fRes = val <= 0 ? NaN : Math.log10(val); break;
          case 'ln': fRes = val <= 0 ? NaN : Math.log(val); break;
          case 'abs': fRes = Math.abs(val); break;
          default: return 'Syntax Error';
        }
        stack.push(fRes);
      } else if (item.type === 'op') {
        if (item.value === 'u-') {
          if (!stack.length) return 'Syntax Error';
          stack.push(-stack.pop());
        } else {
          if (stack.length < 2) return 'Syntax Error';
          var b = stack.pop();
          var a = stack.pop();
          switch (item.value) {
            case '+': stack.push(a + b); break;
            case '-': stack.push(a - b); break;
            case '*': stack.push(a * b); break;
            case '/':
              if (b === 0) return 'Error (÷ 0)';
              stack.push(a / b);
              break;
            case '%': stack.push(a % b); break;
            case '^': stack.push(Math.pow(a, b)); break;
          }
        }
      }
    }

    if (stack.length !== 1) return 'Syntax Error';
    var ans = stack[0];
    if (isNaN(ans) || !isFinite(ans)) return 'Error';
    return String(parseFloat(ans.toPrecision(12)));
  }

  function inputDigit(digit) {
    playKeyTone(digit);
    if (state.display === '0' || state.display === 'Error' || state.resetNext) {
      state.display = String(digit);
      state.resetNext = false;
    } else {
      if (state.display.length < 24) {
        state.display += String(digit);
      }
    }
    render();
  }

  function inputDecimal() {
    playKeyTone('.');
    if (state.resetNext || state.display === 'Error') {
      state.display = '0.';
      state.resetNext = false;
    } else if (state.display.indexOf('.') === -1) {
      state.display += '.';
    }
    render();
  }

  function inputOperator(op) {
    playKeyTone(op);
    if (state.display === 'Error') return;
    if (state.expression && state.resetNext && !state.expression.endsWith('=')) {
      state.expression = state.expression.replace(/[+\-×÷%^]\s*$/, op + ' ');
    } else {
      state.expression = state.display + ' ' + op + ' ';
    }
    state.resetNext = true;
    render();
  }

  function inputBracket(bracket) {
    playKeyTone(bracket);
    if (state.display === '0' || state.resetNext || state.display === 'Error') {
      state.display = bracket;
      state.resetNext = false;
    } else {
      state.display += bracket;
    }
    render();
  }

  function clearAll() {
    playKeyTone('AC');
    state.display = '0';
    state.expression = '';
    state.resetNext = false;
    render();
  }

  function backspace() {
    playKeyTone('BS');
    if (state.resetNext || state.display === 'Error') {
      state.display = '0';
      state.resetNext = false;
    } else {
      state.display = state.display.slice(0, -1);
      if (state.display === '' || state.display === '-') {
        state.display = '0';
      }
    }
    render();
  }

  function calculate() {
    if (state.display === 'Error') return;
    playKeyTone('=');

    var toEval = '';
    if (state.expression && !state.expression.endsWith('=')) {
      toEval = state.expression + state.display;
    } else {
      toEval = state.display;
    }

    var result = evaluateExpression(toEval, state.isRadian);
    state.expression = toEval + ' =';
    state.display = result;
    state.resetNext = true;
    render();
  }

  function scientificOp(type) {
    if (state.display === 'Error') return;
    playKeyTone(type);
    var val = parseFloat(state.display);
    var res = 0;

    switch (type) {
      case 'sin':
        res = state.isRadian ? Math.sin(val) : Math.sin(val * Math.PI / 180);
        break;
      case 'cos':
        res = state.isRadian ? Math.cos(val) : Math.cos(val * Math.PI / 180);
        break;
      case 'tan':
        res = state.isRadian ? Math.tan(val) : Math.tan(val * Math.PI / 180);
        break;
      case 'sqrt':
        res = val < 0 ? NaN : Math.sqrt(val);
        break;
      case 'cbrt':
        res = Math.cbrt(val);
        break;
      case 'log':
        res = val <= 0 ? NaN : Math.log10(val);
        break;
      case 'ln':
        res = val <= 0 ? NaN : Math.log(val);
        break;
      case 'fact':
        res = factorial(val);
        break;
      case 'recip':
        res = val === 0 ? NaN : (1 / val);
        break;
      case 'abs':
        res = Math.abs(val);
        break;
      case 'neg':
        res = -val;
        break;
      case 'pi':
        res = Math.PI;
        break;
      case 'e':
        res = Math.E;
        break;
      default:
        return;
    }

    if (isNaN(res) || !isFinite(res)) {
      state.display = 'Error';
    } else {
      state.display = String(parseFloat(res.toPrecision(12)));
    }
    state.resetNext = true;
    render();
  }

  function memoryOp(type) {
    playKeyTone('MEM');
    var val = parseFloat(state.display) || 0;
    switch (type) {
      case 'MC':
        state.memory = 0;
        state.hasMemory = false;
        toast('Memory cleared');
        break;
      case 'MR':
        if (state.hasMemory) {
          state.display = String(state.memory);
          state.resetNext = true;
        }
        break;
      case 'M+':
        state.memory += val;
        state.hasMemory = true;
        toast('Added to memory (M = ' + state.memory + ')');
        break;
      case 'M-':
        state.memory -= val;
        state.hasMemory = true;
        toast('Subtracted from memory');
        break;
    }
    render();
  }

  function countSheep() {
    state.sheepCount++;
    state.display = state.sheepCount + ' 🐑';
    state.expression = 'Counting sheep to fall asleep...';
    state.resetNext = true;

    playKeyTone(state.sheepCount);
    if (state.sheepCount >= 10) {
      toast('💤 ' + state.sheepCount + ' sheep counted! Pip is drifting off to dreamland.');
    }
    render();
  }

  function toggleAngleMode() {
    state.isRadian = !state.isRadian;
    var btn = $('#calcAngleMode');
    if (btn) btn.textContent = state.isRadian ? 'RAD' : 'DEG';
    toast(state.isRadian ? 'Trig Mode: Radians' : 'Trig Mode: Degrees');
  }

  function toggleChimes() {
    state.chimesEnabled = !state.chimesEnabled;
    var btn = $('#calcMuteBtn');
    if (btn) {
      btn.textContent = state.chimesEnabled ? '🔔 Chimes' : '🔕 Muted';
      btn.setAttribute('aria-label', state.chimesEnabled ? 'Mute calculator chimes' : 'Enable calculator chimes');
    }
    toast(state.chimesEnabled ? 'Starlight Chimes Enabled' : 'Starlight Chimes Muted');
  }

  function render() {
    var dEl = $('#calcDisplay');
    var eEl = $('#calcExpr');
    var mEl = $('#calcMemFlag');

    if (dEl) dEl.textContent = state.display;
    if (eEl) eEl.textContent = state.expression;
    if (mEl) mEl.classList.toggle('is-active', state.hasMemory);
  }

  function initCalc() {
    var win = $('#calc');
    if (!win) return;

    var keysWrap = $('#calcKeys');
    if (keysWrap) {
      keysWrap.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-act]');
        if (!btn) return;

        var act = btn.getAttribute('data-act');
        var val = btn.getAttribute('data-val');

        switch (act) {
          case 'num': inputDigit(parseInt(val, 10)); break;
          case 'dot': inputDecimal(); break;
          case 'op': inputOperator(val); break;
          case 'paren': inputBracket(val); break;
          case 'eq': calculate(); break;
          case 'clear': clearAll(); break;
          case 'back': backspace(); break;
          case 'sci': scientificOp(val); break;
          case 'mem': memoryOp(val); break;
          case 'sheep': countSheep(); break;
          case 'mode': toggleAngleMode(); break;
        }
      });
    }

    var muteBtn = $('#calcMuteBtn');
    if (muteBtn) {
      muteBtn.addEventListener('click', toggleChimes);
    }

    var angleBtn = $('#calcAngleMode');
    if (angleBtn) {
      angleBtn.addEventListener('click', toggleAngleMode);
    }

    var sheepBtn = $('#calcSheepBtn');
    if (sheepBtn) {
      sheepBtn.addEventListener('click', countSheep);
    }

    document.addEventListener('keydown', function (e) {
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (!win.contains(document.activeElement) && document.activeElement !== win) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        inputDigit(parseInt(e.key, 10));
      } else if (e.key === '.') {
        e.preventDefault();
        inputDecimal();
      } else if (e.key === '(' || e.key === ')') {
        e.preventDefault();
        inputBracket(e.key);
      } else if (['+', '-', '*', '/', '%', '^'].indexOf(e.key) !== -1) {
        e.preventDefault();
        var op = e.key === '*' ? '×' : (e.key === '/' ? '÷' : e.key);
        inputOperator(op);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculate();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        backspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        clearAll();
      }
    });

    render();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initCalc);
    } else {
      initCalc();
    }
  }

  var calcAPI = {
    init: initCalc,
    getState: function () { return state; },
    inputDigit: inputDigit,
    inputDecimal: inputDecimal,
    inputOperator: inputOperator,
    inputBracket: inputBracket,
    calculate: calculate,
    scientificOp: scientificOp,
    memoryOp: memoryOp,
    clearAll: clearAll,
    countSheep: countSheep,
    toggleAngleMode: toggleAngleMode,
    toggleChimes: toggleChimes,
    factorial: factorial,
    evaluateExpression: evaluateExpression
  };

  PIP.calc = calcAPI;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = calcAPI;
  }
})();
