// Service worker: makes the app installable, opens pages offline from cache,
// and shows push notifications for payment reminders.
// API data is never cached (the API is on another origin), so numbers are always fresh.
const CACHE = 'finance-shell-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/icons/icon-192.png'])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Only same-origin GET requests (the backend API is on another origin and is not touched)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Network first; fall back to the cache when offline
  event.respondWith(
    fetch(req)
      .then((res) => {
        const cacheable = url.pathname.startsWith('/_next/static') || url.pathname.startsWith('/icons') ||
          url.pathname.startsWith('/splash') || req.mode === 'navigate';
        if (res.ok && cacheable) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('/')))
  );
});

// Push from the backend: { title, body, url, tag }
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data && event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Payment reminder', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag,
      data: { url: data.url || '/reminders' },
    })
  );
});

// Tapping a notification opens (or focuses) the app on the Reminders page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/reminders';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) { c.navigate(target).catch(() => {}); return c.focus(); }
      }
      return self.clients.openWindow(target);
    })
  );
});
