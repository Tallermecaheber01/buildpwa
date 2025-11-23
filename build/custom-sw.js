// custom-sw.js
const CACHE_NAME = 'pwa-cache-v7';
const APP_SHELL = [
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
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// =========================
// ACTIVATE
// =========================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// =========================
// PUSH (desde backend)
// =========================
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: 'Taller Heber',
      body: event.data ? event.data.text() : 'Tienes una notificación',
    };
  }

  const title = data.title || 'Servicio Automotriz Heber';
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: data.icon || '/icons/logouno.png',
    badge: data.badge || '/icons/logouno.png',
    vibrate: data.vibrate || [100, 50, 100],
    data: {
      url: data.url || '/',
      ...data.data,
    },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// =========================
// CLICK EN NOTIFICACIÓN
// =========================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// =========================
// MENSAJES INTERNOS
// (offline/online desde index.js)
// =========================
self.addEventListener('message', (event) => {
  const data = event.data || {};

  if (data.type === 'SHOW_NOTIFICATION') {
    const { title, body, url } = data;

    self.registration.showNotification(title || 'Servicio Automotriz Heber', {
      body: body || 'Notificación interna',
      icon: '/icons/logouno.png',
      badge: '/icons/logouno.png',
      data: { url: url || '/' },
    });
  }
});

// =========================
// FETCH HANDLER
// =========================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // No interceptar backend real
  if (url.origin === 'https://theberback.onrender.com') return;

  // Archivos estáticos
  if (url.pathname.match(/^\/(static|favicon|icons|manifest).*$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;

        return fetch(event.request)
          .then((networkRes) => {
            if (
              !networkRes ||
              networkRes.status !== 200 ||
              networkRes.headers.get('content-type')?.includes('text/html')
            ) {
              return networkRes;
            }

            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return networkRes;
          })
          .catch(() => caches.match('/index.html'));
      })
    );
    return;
  }

  // Rutas internas SPA
  if (APP_SHELL.includes(url.pathname) || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((res) => res)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Default: Cache → Network → index.html fallback
  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached || fetch(event.request))
      .catch(() => caches.match('/index.html'))
  );
});
