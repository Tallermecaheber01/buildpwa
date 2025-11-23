// custom-sw.js
const CACHE_NAME = 'pwa-cache-v5';
const APP_SHELL = [
  '/',
  '/index.html',
  '/consultaservicios',
  '/politicadeprivacidad',
  '/terminosycondiciones',
  '/acercade',
  '/deslinde'
];

// INSTALL
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener('activate', event => {
  // limpiar caches viejos si hace falta (ejemplo)
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// PUSH: mostrar notificación al recibir push desde el servidor
self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    // en caso de payload texto
    data = { title: 'Taller Heber', body: event.data ? event.data.text() : 'Tienes una notificación' };
  }

  const title = data.title || 'Servicio Automotriz Heber';
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: data.icon || '/icons/logouno.png',
    badge: data.badge || '/icons/logouno.png',
    vibrate: data.vibrate || [100, 50, 100],
    data: {
      url: data.url || '/',      // URL que abriremos al click
      ...data.data               // cualquier otra información útil
    },
    actions: data.actions || []   // ejemplo: [{action:'open', title:'Ver'}]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// CLICK en la notificación
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const urlToOpen = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Si ya hay una ventana con la URL, darle focus
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir nueva ventana/pestaña
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// MENSAJES internos (desde la página)
self.addEventListener('message', event => {
  const data = event.data || {};
  if (data && data.type === 'SHOW_NOTIFICATION') {
    const { title, body, url } = data;
    self.registration.showNotification(title || 'Taller Heber', {
      body: body || 'Notificación interna',
      icon: '/icons/logouno.png',
      data: { url: url || '/' }
    });
  }
});

// FETCH: manejo diferenciado para archivos estáticos y rutas SPA
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // No interceptar backend real
  if (url.origin === 'https://theberback.onrender.com') {
    return;
  }

  // Archivos estáticos del build (cache-first, actualiza cache con network)
  if (url.pathname.match(/^\/(static|favicon|icons|manifest).*$/)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(networkRes => {
          // si la respuesta es HTML por error, NO cachearla como archivo estático
          if (!networkRes || networkRes.status !== 200 || networkRes.headers.get('content-type')?.includes('text/html')) {
            return networkRes;
          }
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return networkRes;
        }).catch(() => caches.match('/index.html'));
      })
    );
    return;
  }

  // Rutas internas de SPA -> network-first con fallback a index.html
  if (APP_SHELL.includes(url.pathname) || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          // si es 200 y no es HTML inesperado, opcionalmente actualizar cache
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Default: try cache, else network, else index.html
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
      .catch(() => caches.match('/index.html'))
  );
});
