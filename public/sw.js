// Service worker: lets the app be installed and opens app pages quickly.
// API data is never cached, so the numbers you see are always fresh.
const CACHE = 'finance-shell-v1';

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
  // Only handle same-origin GET requests (the backend API is on another port and is not touched)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Network first, fall back to cache when the server is not running
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && (url.pathname.startsWith('/_next/static') || url.pathname.startsWith('/icons'))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('/')))
  );
});

// Clicking a reminder notification opens/focuses the app on the Reminders page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) { c.navigate('/reminders'); return c.focus(); }
      }
      return self.clients.openWindow('/reminders');
    })
  );
});
