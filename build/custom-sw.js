// =========================
// SKIP WAITING & CLAIM
// =========================
self.addEventListener('install', (event) => {
  self.skipWaiting();

  // Cachear páginas específicas offline
  const OFFLINE_PAGES = [
    '/',
    '/consultaservicios',
    '/politicadeprivacidad',
    '/terminosycondiciones',
    '/acercade',
    '/deslinde'
  ];

  event.waitUntil(
    caches.open('pwa-pages-v1').then(cache => cache.addAll(OFFLINE_PAGES))
  );
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});


// =========================
// NOTIFICACIONES PUSH
// =========================
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Servicio Automotriz Heber';
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: '/icons/logouno.png',
    badge: '/icons/logouno.png',
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});


// =========================
// MENSAJES INTERNOS
// =========================
self.addEventListener('message', event => {
  const data = event.data || {};
  self.registration.showNotification(data.title || 'Taller Heber', {
    body: data.body || 'Notificación interna',
    icon: '/icons/logouno.png',
    vibrate: [100, 50, 100],
  });
});


// =========================
// FETCH para páginas offline
// =========================
const OFFLINE_PAGES = [
  '/',
  '/consultaservicios',
  '/politicadeprivacidad',
  '/terminosycondiciones',
  '/acercade',
  '/deslinde'
];

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Solo interceptamos si es HTML y está en la lista
  if (OFFLINE_PAGES.includes(url.pathname)) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});
