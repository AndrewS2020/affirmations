// CACHE_NAME is rewritten on every build by scripts/inject-build-id.js.
// Do not commit a static name here — the placeholder below MUST remain so the
// post-build step can substitute a fresh timestamp and force the browser to
// detect a new service worker.
const CACHE_NAME ='affirmations-pwa-__BUILD_ID__';
const STATIC_CACHE_NAME = `${CACHE_NAME}-static`;

const CORE_ASSETS = [
  '/affirmations/',
  '/affirmations/index.html',
  '/affirmations/manifest.json',
  '/affirmations/icons/icon.svg'
];

// Install: cache core shell, take over immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[SW] Core asset pre-cache warning:', err);
      })
    ).then(() => self.skipWaiting())
  );
});

// Activate: drop old caches, claim open clients so the new SW serves them right away
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== STATIC_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Listen for SKIP_WAITING requests from the page (used by the update toast)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function isNavigationRequest(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').includes('text/html'))
  );
}

function isHashedAsset(url) {
  // Vite emits content-hashed filenames like index-BhBD9SpY.js — these are
  // immutable by design, so cache-first is safe. Allow any alphanumeric hash,
  // not just [a-f0-9], since Vite's default uses base64-ish characters.
  return /\/assets\/[^/]+\.[A-Za-z0-9_-]{6,}\.(js|css)(\?.*)?$/i.test(url.pathname);
}

function isStaticAsset(url) {
  return (
    isHashedAsset(url) ||
    url.pathname.startsWith('/affirmations/icons/') ||
    url.pathname.startsWith('/affirmations/landscapes/')
  );
}

// Fetch:
//  - navigation/HTML: network-first, fallback to cached HTML, then to /
//  - hashed/static assets: cache-first, refresh in background
//  - everything else: passthrough (no respondWith)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip cross-origin and API calls entirely — let the browser handle them
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/api/')) return;

  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match('/affirmations/index.html');
          if (fallback) return fallback;
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // For anything else (fonts.googleapis.com, etc.) — don't intervene.
  // The browser will handle it normally.
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
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
