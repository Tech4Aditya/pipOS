/* security.js: PipOS Defense-in-Depth & Prototype Pollution Defense Module
   Provides zero-dependency safe JSON parsing, prototype pollution guards,
   recursive object freezing, URL protocol whitelisting, and entity sanitization. */
(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
  var PIP = (root.PIP = root.PIP || {});

  var BANNED_KEYS = ['__proto__', 'constructor', 'prototype'];
  var ALLOWED_SCHEMES = ['http:', 'https:', 'mailto:', '#'];

  // Safe reviver function for JSON.parse to block prototype pollution keys
  function safeReviver(key, value) {
    if (BANNED_KEYS.indexOf(key) !== -1) {
      return undefined; // Drop banned prototype injection keys
    }
    return value;
  }

  // Safe JSON parser: strips __proto__, constructor, and prototype recursively
  function safeJsonParse(text, fallback) {
    if (typeof text !== 'string') return fallback;
    try {
      var parsed = JSON.parse(text, safeReviver);
      if (parsed === null || typeof parsed !== 'object') {
        return parsed;
      }
      // Additional recursive scan to ensure no prototype pollution survived
      stripDangerousKeys(parsed);
      return parsed;
    } catch (e) {
      return fallback;
    }
  }

  // Recursively remove dangerous prototype pollution properties from parsed object trees
  function stripDangerousKeys(obj) {
    if (!obj || typeof obj !== 'object') return;
    for (var i = 0; i < BANNED_KEYS.length; i++) {
      var banned = BANNED_KEYS[i];
      if (Object.prototype.hasOwnProperty.call(obj, banned)) {
        try {
          delete obj[banned];
        } catch (e) {
          obj[banned] = undefined;
        }
      }
    }
    for (var k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] && typeof obj[k] === 'object') {
        stripDangerousKeys(obj[k]);
      }
    }
  }

  // Recursively freeze an object and all its nested properties to make them immutable
  function deepFreeze(obj) {
    if (!obj || typeof obj !== 'object' || Object.isFrozen(obj)) {
      return obj;
    }
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach(function (prop) {
      var val = obj[prop];
      if (val && (typeof val === 'object' || typeof val === 'function') && !Object.isFrozen(val)) {
        deepFreeze(val);
      }
    });
    return obj;
  }

  // Sanitize text into safe HTML entities (prevent XSS in text outputs)
  function sanitizeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Validate URL protocol to block javascript:, vbscript:, data: protocols
  function isSafeUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return false;
    var trimmed = rawUrl.trim();
    if (trimmed.indexOf('#') === 0 || trimmed.indexOf('/') === 0) {
      return true; // Relative paths and anchor links are safe
    }
    try {
      var parsed = new URL(trimmed, root.location ? root.location.origin : 'https://tech4aditya.github.io');
      return ALLOWED_SCHEMES.indexOf(parsed.protocol) !== -1;
    } catch (e) {
      return false;
    }
  }

  var Security = {
    safeJsonParse: safeJsonParse,
    deepFreeze: deepFreeze,
    sanitizeHtml: sanitizeHtml,
    isSafeUrl: isSafeUrl,
    stripDangerousKeys: stripDangerousKeys
  };

  PIP.security = Security;
  PIP.safeJsonParse = safeJsonParse;
  PIP.deepFreeze = deepFreeze;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Security;
  }
})();
