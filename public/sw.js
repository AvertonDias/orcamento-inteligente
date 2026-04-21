
// Service Worker básico para permitir a instalação do PWA
const CACHE_NAME = 'orcamento-inteligente-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Estratégia Network-first: tenta a rede, se falhar (offline), não faz nada especial por enquanto
  // (O objetivo principal aqui é apenas satisfazer o critério de instalação do PWA)
  event.respondWith(fetch(event.request).catch(() => {
    return caches.match(event.request);
  }));
});
