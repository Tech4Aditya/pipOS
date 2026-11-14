/* sw.js: Service Worker for pipOS Progressive Web App (PWA).
   Provides offline functionality, pre-caches essential local assets,
   serves cached offline fallbacks, and handles Google Fonts degradation. */

var CACHE_NAME = 'pipos-v1';

var PRECACHE_ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/util.js',
  'js/audio.js',
  'js/wall.js',
  'js/fx.js',
  'js/pip.js',
  'js/toys.js',
  'js/main.js',
  'assets/favicon.svg',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/icon-maskable-512.png',
  'assets/apple-touch-icon.png'
];

var swScope = typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : this);

// Install: pre-cache all essential local assets
if (typeof swScope.addEventListener === 'function') {
  swScope.addEventListener('install', function (event) {
    event.waitUntil(
      caches.open(CACHE_NAME).then(function (cache) {
        return cache.addAll(PRECACHE_ASSETS);
      }).then(function () {
        return swScope.skipWaiting ? swScope.skipWaiting() : Promise.resolve();
      })
    );
  });

  // Activate: clean up outdated caches and take control
  swScope.addEventListener('activate', function (event) {
    event.waitUntil(
      caches.keys().then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      }).then(function () {
        return (swScope.clients && swScope.clients.claim) ? swScope.clients.claim() : Promise.resolve();
      })
    );
  });

  // Fetch: serve cached local assets, provide offline fallback, degrade Google Fonts gracefully
  swScope.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET') return;

    var url = new URL(event.request.url);

    // Handle Google Fonts gracefully when offline
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
      event.respondWith(
        fetch(event.request).catch(function () {
          // When Google Fonts is unreachable offline, return an empty stylesheet or 204
          // so the browser immediately and cleanly falls back to system fonts without hanging.
          if (url.hostname === 'fonts.googleapis.com') {
            return new Response('/* Google Fonts offline fallback */', {
              status: 200,
              headers: { 'Content-Type': 'text/css; charset=utf-8' }
            });
          }
          return new Response(null, { status: 204, statusText: 'No Content (Offline)' });
        })
      );
      return;
    }

    // Cache only local files; bypass other third-party origins (e.g. optional wish backends)
    if (self.location && url.origin !== self.location.origin) {
      return;
    }

    // Cache-first strategy for local assets with network fallback and background refresh
    event.respondWith(
      caches.match(event.request).then(function (cachedResponse) {
        if (cachedResponse) {
          // Fetch in background to update cache if online
          fetch(event.request).then(function (networkResponse) {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(function (cache) {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(function () {
            // Offline, cachedResponse already served
          });
          return cachedResponse;
        }

        // Not in cache: fetch from network
        return fetch(event.request).then(function (networkResponse) {
          if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            var responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(function (err) {
          // Offline navigation fallback: serve cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('index.html').then(function (fallback) {
              return fallback || caches.match('./');
            });
          }
          throw err;
        });
      })
    );
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CACHE_NAME: CACHE_NAME,
    PRECACHE_ASSETS: PRECACHE_ASSETS
  };
}
