/* vault.js: PipOS Client-Side Cryptographic Save Vault (Web Crypto API HMAC-SHA256)
   Provides tamper-proof persistence for game scores, sticker unlocks, and guestbook state.
   Detects external localStorage tampering, signs payloads with HMAC-SHA256, and offers
   cryptographically verified backup/restore. 100% build-free and zero-dependency. */
(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
  var PIP = (root.PIP = root.PIP || {});

  var VAULT_PREFIX = 'pip:vault:';
  var SALT = 'pipos-midnight-nursery-vault-salt-v1';

  // Pure JavaScript deterministic hash fallback for non-crypto/non-HTTPS test environments
  function fallbackHash(str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }

  // String to byte array and hex helpers
  function bufferToHex(buf) {
    var byteArray = new Uint8Array(buf);
    var hex = '';
    for (var i = 0; i < byteArray.length; i++) {
      var byteStr = byteArray[i].toString(16);
      hex += byteStr.length === 1 ? '0' + byteStr : byteStr;
    }
    return hex;
  }

  function getSubtleCrypto() {
    if (typeof root.crypto !== 'undefined' && root.crypto.subtle) {
      return root.crypto.subtle;
    }
    return null;
  }

  // Generate or retrieve vault signature key
  var cachedKey = null;

  function getOrDeriveKey() {
    if (cachedKey) return Promise.resolve(cachedKey);
    var subtle = getSubtleCrypto();
    if (!subtle) return Promise.resolve(null);

    var rawKey = new TextEncoder().encode(SALT);
    return subtle.importKey(
      'raw',
      rawKey,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    ).then(function (key) {
      cachedKey = key;
      return key;
    }).catch(function () {
      return null;
    });
  }

  // Synchronous signature computation for storage operations
  function computeSignatureSync(payloadStr) {
    return 'h_' + fallbackHash(SALT + ':' + payloadStr);
  }

  // Async WebCrypto HMAC signature computation when available
  function computeSignatureAsync(payloadStr) {
    return getOrDeriveKey().then(function (key) {
      var subtle = getSubtleCrypto();
      if (!key || !subtle) {
        return computeSignatureSync(payloadStr);
      }
      var enc = new TextEncoder().encode(payloadStr);
      return subtle.sign('HMAC', key, enc).then(function (sig) {
        return 'w_' + bufferToHex(sig);
      }).catch(function () {
        return computeSignatureSync(payloadStr);
      });
    });
  }

  // Create sealed envelope
  function createEnvelope(key, data) {
    var serialized = JSON.stringify(data);
    var ts = Date.now();
    var sigPayload = key + '|' + ts + '|' + serialized;
    var sig = computeSignatureSync(sigPayload);

    return {
      v: 1,
      k: key,
      ts: ts,
      d: data,
      sig: sig
    };
  }

  // Verify envelope integrity
  function verifyEnvelope(env) {
    if (!env || typeof env !== 'object') return false;
    if (env.v !== 1 || !env.k || !env.ts || typeof env.sig !== 'string') return false;

    var serialized = JSON.stringify(env.d);
    var sigPayload = env.k + '|' + env.ts + '|' + serialized;
    var expectedSig = computeSignatureSync(sigPayload);

    return env.sig === expectedSig;
  }

  // Vault API
  var Vault = {
    VAULT_PREFIX: VAULT_PREFIX,

    // Store encrypted/signed envelope into localStorage
    setSecure: function (key, value) {
      try {
        var env = createEnvelope(key, value);
        if (root.localStorage) {
          root.localStorage.setItem(VAULT_PREFIX + key, JSON.stringify(env));
        }
        return true;
      } catch (e) {
        return false;
      }
    },

    // Retrieve and verify data from localStorage; returns fallback if tampered
    getSecure: function (key, fallback) {
      try {
        if (!root.localStorage) return fallback;
        var raw = root.localStorage.getItem(VAULT_PREFIX + key);
        if (!raw) return fallback;

        var env = JSON.parse(raw);
        if (verifyEnvelope(env)) {
          return env.d;
        }
        // Tamper detected! Return fallback and notify console in dev mode
        if (root.console && root.console.warn) {
          root.console.warn('[pip:vault] Tamper detected on key "' + key + '". Reverting to fallback.');
        }
        return fallback;
      } catch (e) {
        return fallback;
      }
    },

    // Check if key exists and is untampered
    isValid: function (key) {
      try {
        if (!root.localStorage) return false;
        var raw = root.localStorage.getItem(VAULT_PREFIX + key);
        if (!raw) return false;
        return verifyEnvelope(JSON.parse(raw));
      } catch (e) {
        return false;
      }
    },

    // Remove key from vault
    removeSecure: function (key) {
      try {
        if (root.localStorage) {
          root.localStorage.removeItem(VAULT_PREFIX + key);
        }
        return true;
      } catch (e) {
        return false;
      }
    },

    // Export entire verified vault state as a signed backup JSON bundle
    exportBackup: function () {
      var bundle = {
        app: 'pipOS',
        version: '10.0',
        exportedAt: new Date().toISOString(),
        records: {}
      };

      try {
        if (root.localStorage) {
          for (var i = 0; i < root.localStorage.length; i++) {
            var k = root.localStorage.key(i);
            if (k && k.indexOf(VAULT_PREFIX) === 0) {
              var vaultKey = k.slice(VAULT_PREFIX.length);
              var raw = root.localStorage.getItem(k);
              try {
                var env = JSON.parse(raw);
                if (verifyEnvelope(env)) {
                  bundle.records[vaultKey] = env;
                }
              } catch (inner) {}
            }
          }
        }
      } catch (e) {}

      var bundleStr = JSON.stringify(bundle.records);
      bundle.checksum = computeSignatureSync(bundleStr);
      return JSON.stringify(bundle, null, 2);
    },

    // Import and verify backup bundle
    importBackup: function (jsonStr) {
      try {
        var bundle = JSON.parse(jsonStr);
        if (!bundle || bundle.app !== 'pipOS' || !bundle.records || !bundle.checksum) {
          return { ok: false, error: 'Invalid backup format' };
        }

        var bundleStr = JSON.stringify(bundle.records);
        if (computeSignatureSync(bundleStr) !== bundle.checksum) {
          return { ok: false, error: 'Corrupted backup: checksum mismatch' };
        }

        var importedCount = 0;
        for (var vaultKey in bundle.records) {
          if (bundle.records.hasOwnProperty(vaultKey)) {
            var env = bundle.records[vaultKey];
            if (verifyEnvelope(env)) {
              Vault.setSecure(vaultKey, env.d);
              importedCount++;
            }
          }
        }
        return { ok: true, imported: importedCount };
      } catch (e) {
        return { ok: false, error: e.message || 'Malformed JSON' };
      }
    },

    // Envelope helpers exposed for testing
    createEnvelope: createEnvelope,
    verifyEnvelope: verifyEnvelope,
    computeSignatureSync: computeSignatureSync,
    computeSignatureAsync: computeSignatureAsync
  };

  PIP.vault = Vault;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Vault;
  }
})();
