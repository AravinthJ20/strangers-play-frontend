self.addEventListener('push', (event) => {
  if (!event.data) return;

  const payload = event.data.json();
  const title = payload.title || 'Strangers Play';
  const options = {
    body: payload.body || 'You have a new update.',
    icon: '/assets/images/Strangers_Play_logo.png',
    badge: '/assets/images/Strangers_Play_logo.png',
    data: {
      url: payload.url || '/chat'
    },
    tag: payload.tag || 'strangers-play'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/chat';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});
