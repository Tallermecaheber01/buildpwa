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
// FETCH SOLO PARA TUS RUTAS
// =========================
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // NO tocar los requests al backend
  if (url.origin === 'https://theberback.onrender.com') return;

  // Si es una de tus rutas SPA
  if (SPA_ROUTES.includes(url.pathname)) {
    event.respondWith(
      caches.match(url.pathname).then(res => {
        return res || caches.match('/index.html');
      })
    );
    return;
  }

  // Todo lo demás
  event.respondWith(
    fetch(event.request)
      .then(response => response)
      .catch(async () => {

        // 1. Intentar devolver desde cache
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // 2. Si es navegación, devolver index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }

        // 3. Como ÚLTIMO recurso, regresar una Response válida
        return new Response('', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});
