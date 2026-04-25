/**
 * Service Worker — ProdeFootball
 * Cachea el shell de la app para uso offline.
 * Las llamadas a la API van siempre a la red (network-first).
 */

const CACHE = 'prodefootball-v1';

const SHELL = [
  './index.html',
  './css/styles.css',
  './js/api.js',
  './js/predictions.js',
  './js/app.js',
  './pages/partidos.html',
  './pages/predicciones.html',
  './pages/clasificacion.html',
  './manifest.json',
  './assets/icons/icon.svg',
];

// Instala y pre-cachea el shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// Limpia caches viejas al activar
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Estrategia: API → network-first; resto → cache-first
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
