
// Service Worker simples para habilitar a instalação PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Necessário para critérios de instalação, mesmo que vazio
});
