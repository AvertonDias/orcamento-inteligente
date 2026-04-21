
// Service Worker simplificado para garantir instalabilidade PWA
const CACHE_NAME = 'orcsmart-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Apenas passa as requisições adiante. 
  // O objetivo principal aqui é cumprir os requisitos de PWA instalável.
  event.respondWith(fetch(event.request).catch(() => {
    return caches.match(event.request);
  }));
});
