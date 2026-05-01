// frontend/public/sol-sw.js
// Service worker for SOL Companion web push.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming push
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: 'SOL', body: event.data?.text?.() ?? '' };
  }

  const title = payload.title || 'SOL Companion';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/sol-icon-192.png',
    badge: payload.badge || '/sol-badge-72.png',
    tag: payload.tag || payload.notificationId || 'sol-default',
    renotify: !!payload.renotify,
    data: {
      url: payload.deepLink || payload.url || '/',
      notificationId: payload.notificationId,
      type: payload.type,
    },
    actions: payload.actions || [],
    vibrate: payload.vibrate || [80, 40, 80],
    silent: !!payload.silent,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Click → focus existing SOL tab or open new
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      // Prefer existing tab on same origin
      for (const client of allClients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.postMessage({
            source: 'sol-sw',
            action: 'open-widget',
            deepLink: targetUrl,
            notificationId: event.notification?.data?.notificationId,
          });
          return;
        }
      }
      // Otherwise open new window
      await self.clients.openWindow(targetUrl);
    })()
  );
});

// Hook for future push-triggered data sync
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
