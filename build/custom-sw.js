const CACHE_NAME = 'pwa-cache-v2';

const APP_SHELL = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/icons/logouno.png',
  '/consultaservicios',
  '/politicadeprivacidad',
  '/terminosycondiciones',
  '/acercade',
  '/deslinde'
];

// =========================
// INSTALL
// =========================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// =========================
// ACTIVATE
// =========================
self.addEventListener('activate', event => {
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
// FETCH (ÚNICO Y CORRECTO)
// =========================
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => response)
      .catch(() =>
        caches.match(event.request).then(res => {
          if (res) return res;
          return caches.match('/'); // React fallback
        })
      )
  );
});
