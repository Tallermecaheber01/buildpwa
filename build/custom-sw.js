console.log("Custom SW cargado correctamente");

// Esto evita que se capture el SW del backend
const OFFLINE_PAGES = [
  '/',
  '/index.html',
  '/consultaservicios',
  '/politicadeprivacidad',
  '/terminosycondiciones',
  '/acercade',
  '/deslinde'
];

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  // No interferir con el backend remoto
  if (url.origin === 'https://theberback.onrender.com') return;

  // SPA OFFLINE ROUTES
  if (OFFLINE_PAGES.includes(url.pathname)) {
    event.respondWith(
      caches.match('/index.html')
    );
    return;
  }

  // fallback general
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
