const CACHE_NAME = 'pwa-cache-v2';

const APP_SHELL = [
  '/',
  '/index.html',
  '/consultaservicios',
  '/politicadeprivacidad',
  '/terminosycondiciones',
  '/acercade',
  '/deslinde'
];

const SPA_ROUTES = [
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
// FETCH SOLO PARA TUS RUTAS SPA
// =========================
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // NO interceptar peticiones al backend real
  if (url.origin === 'https://theberback.onrender.com') {
    return;  
  }

  // ✔ SOLO las rutas que tú listas
  if (SPA_ROUTES.includes(url.pathname)) {
    event.respondWith(
      caches.match(url.pathname).then(res => {
        // si está en cache, úsalo
        if (res) return res;
        // si no está, fallback a index.html
        return caches.match('/index.html');
      })
    );
    return;
  }

  // ✔ Resto de recursos del frontend
  event.respondWith(
    fetch(event.request)
      .then(response => response)
      .catch(() =>
        caches.match(event.request).then(res => {
          if (res) return res;

          // fallback solo para navegaciones React
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }

          return null;
        })
      )
  );
});
