self.addEventListener('install', (event) => self.skipWaiting());
self.addEventListener('activate', (event) => self.clients.claim());

// Notificaciones Push
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

// Mensajes internos
self.addEventListener('message', event => {
  const data = event.data || {};
  self.registration.showNotification(data.title || 'Taller Heber', {
    body: data.body || 'Notificación interna',
    icon: '/icons/logouno.png',
    vibrate: [100, 50, 100],
  });
});
