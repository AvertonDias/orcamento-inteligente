
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Estratégia de rede para garantir que os dados do Firebase sejam sempre frescos
  // e o PWA seja detectado como válido pelo navegador.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request));
  }
});
