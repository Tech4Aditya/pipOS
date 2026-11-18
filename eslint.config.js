// eslint.config.js - dev-only linting configuration for pipOS
const globals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  localStorage: 'readonly',
  performance: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  AudioContext: 'readonly',
  webkitAudioContext: 'readonly',
  Image: 'readonly',
  Blob: 'readonly',
  URL: 'readonly',
  console: 'readonly',
  require: 'readonly',
  module: 'readonly',
  __dirname: 'readonly',
  process: 'readonly',
  globalThis: 'readonly',
  global: 'readonly',
  fetch: 'readonly',
  AbortController: 'readonly',
  IntersectionObserver: 'readonly',
  SpeechSynthesisUtterance: 'readonly'
};

module.exports = [
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: globals
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-constant-condition': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'semi': ['warn', 'always']
    }
  }
];
