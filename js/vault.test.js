const test = require('node:test');
const assert = require('node:assert/strict');

// Mock localStorage for Node environment testing
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { for (const k in storage) delete storage[k]; },
  get length() { return Object.keys(storage).length; },
  key: (i) => Object.keys(storage)[i] || null
};

const Vault = require('./vault.js');

test('PipVault: creates valid signed envelope', () => {
  const env = Vault.createEnvelope('highScore', 42);
  assert.strictEqual(env.v, 1);
  assert.strictEqual(env.k, 'highScore');
  assert.strictEqual(env.d, 42);
  assert.ok(typeof env.ts === 'number');
  assert.ok(typeof env.sig === 'string' && env.sig.startsWith('h_'));
});

test('PipVault: verifies authentic envelope successfully', () => {
  const env = Vault.createEnvelope('stickers', ['blocks10', 'star']);
  assert.strictEqual(Vault.verifyEnvelope(env), true);
});

test('PipVault: detects payload tampering and rejects envelope', () => {
  const env = Vault.createEnvelope('highScore', 100);
  // Malicious user attempts to increase score to 99999
  env.d = 99999;
  assert.strictEqual(Vault.verifyEnvelope(env), false);
});

test('PipVault: detects key spoofing and rejects envelope', () => {
  const env = Vault.createEnvelope('userKey', 'validData');
  env.k = 'adminKey';
  assert.strictEqual(Vault.verifyEnvelope(env), false);
});

test('PipVault: setSecure and getSecure persist and retrieve data', () => {
  Vault.setSecure('testScore', 888);
  const retrieved = Vault.getSecure('testScore', 0);
  assert.strictEqual(retrieved, 888);
});

test('PipVault: getSecure returns fallback if localStorage was tampered externally', () => {
  Vault.setSecure('vaultScore', 50);
  const rawKey = Vault.VAULT_PREFIX + 'vaultScore';

  // Simulating external DevTools manipulation
  const stored = JSON.parse(global.localStorage.getItem(rawKey));
  stored.d = 9999; // Tampered without updating signature
  global.localStorage.setItem(rawKey, JSON.stringify(stored));

  const fallbackValue = -1;
  const result = Vault.getSecure('vaultScore', fallbackValue);
  assert.strictEqual(result, fallbackValue, 'Tampered key must return fallback');
});

test('PipVault: exports cryptographically signed backup bundle', () => {
  Vault.setSecure('achievements', ['first_hiccup', 'cloud_courier']);
  Vault.setSecure('starsBest', 450);

  const backupJson = Vault.exportBackup();
  assert.ok(typeof backupJson === 'string');

  const bundle = JSON.parse(backupJson);
  assert.strictEqual(bundle.app, 'pipOS');
  assert.ok(bundle.records.achievements);
  assert.ok(bundle.records.starsBest);
  assert.ok(typeof bundle.checksum === 'string');
});

test('PipVault: imports valid backup bundle successfully', () => {
  Vault.setSecure('lullabyKey', 'pentatonic_c');
  const backupJson = Vault.exportBackup();

  global.localStorage.clear();
  assert.strictEqual(Vault.getSecure('lullabyKey', null), null);

  const importResult = Vault.importBackup(backupJson);
  assert.strictEqual(importResult.ok, true);
  assert.strictEqual(importResult.imported >= 1, true);
  assert.strictEqual(Vault.getSecure('lullabyKey', null), 'pentatonic_c');
});

test('PipVault: rejects corrupted backup with checksum mismatch', () => {
  Vault.setSecure('secretData', 'original');
  const backupJson = Vault.exportBackup();
  const bundle = JSON.parse(backupJson);

  // Alter backup records
  bundle.records.secretData.d = 'hacked';

  const corruptedJson = JSON.stringify(bundle);
  const importResult = Vault.importBackup(corruptedJson);
  assert.strictEqual(importResult.ok, false);
  assert.ok(importResult.error.includes('checksum mismatch'));
});
