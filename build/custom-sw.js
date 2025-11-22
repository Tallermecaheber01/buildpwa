const CACHE_NAME = 'pwa-cache-v3';

// PÁGINAS QUE DEBEN FUNCIONAR OFFLINE
const OFFLINE_PAGES = [
  '/',
  '/index.html',
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
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(OFFLINE_PAGES);
    })
  );

  self.skipWaiting();
});

// =========================
// ACTIVATE
// =========================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

// =========================
// FETCH
// =========================
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // NO tocar las peticiones a tu backend
  if (url.origin === 'https://theberback.onrender.com') return;

  // ==============================
  // 1️⃣ RUTAS SPA QUE QUIERES OFFLINE
  // ==============================
  if (OFFLINE_PAGES.includes(url.pathname)) {
    event.respondWith(
      caches.match(url.pathname)
        .then(res => res || caches.match('/index.html'))
    );
    return;
  }

  // ==============================
  // 2️⃣ PETICIONES NORMALES
  // ==============================
  event.respondWith(
    fetch(event.request)
      .then(response => response)
      .catch(async () => {

        // DEVOLVER DESDE CACHE SI EXISTE
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // SI ES NAVEGACIÓN, DEVOLVER INDEX.HTML
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }

        // ÚLTIMO RECURSO: respuesta vacía válida
        return new Response('', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});
