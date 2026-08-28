const CACHE_NAME = 'linkguard-v12';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon.svg',
  './css/styles.css',
  './js/app.js',
  './js/utils/urlUtils.js',
  './js/utils/storage.js',
  './js/modules/history.js',
  './js/modules/urlParser.js',
  './js/modules/urlEditor.js',
  './js/modules/urlCleaner.js',
  './js/modules/urlUnshortener.js',
  './js/modules/statusChecker.js',
  './js/modules/patternChecker.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // Network-first strategy for ALL local assets so updates reflect immediately
  e.respondWith(
    fetch(e.request).then((networkResponse) => {
      if (networkResponse.status === 200) {
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
      }
      return networkResponse;
    }).catch(() => caches.match(e.request))
  );
});
