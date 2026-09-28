const CACHE_NAME = 'affirmations-pwa-v2';
const ASSETS_TO_CACHE = [
  '/affirmations/',
  '/affirmations/index.html',
  '/affirmations/manifest.json',
  '/affirmations/icons/icon.svg'
];

// Install: Cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Cache pre-fetch warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network First with Cache Fallback for HTML/API, Cache First for Static
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and API calls for caching
  if (event.request.method !== 'GET' || url.pathname.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// Push Notifications Event
self.addEventListener('push', (event) => {
  let data = {
    title: '✨ Твоя аффирмация дня',
    body: 'Сделай глубокий вдох. Всё происходит вовремя и наилучшим образом.',
    url: '/affirmations/',
    id: null
  };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error('Error parsing push payload:', e);
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/affirmations/icons/icon.svg',
    badge: '/affirmations/icons/icon.svg',
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || `/affirmations/?affirmationId=${data.id || ''}`,
      affirmationId: data.id
    },
    actions: [
      { action: 'open', title: '🌸 Открыть' },
      { action: 'zen', title: '🧘 Дзен' }
    ],
    tag: `affirmation-${data.id || Date.now()}`,
    renotify: true,
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '✨ Аффирмация', options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/affirmations/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_OPENED',
            affirmationId: event.notification.data ? event.notification.data.affirmationId : null
          });
          return client.navigate(targetUrl);
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
