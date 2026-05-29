/* Deploy-scoped service worker — network-first for HTML; never cache the app shell long-term. */
const BUILD_ID = '__BUILD_ID__';
const CACHE = `detectra-shell-${BUILD_ID}`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith('detectra-') && k !== CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isNavigation(request) {
  return request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');
}

function isHashedAsset(url) {
  return url.pathname.startsWith('/assets/') && url.pathname.includes('.');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isNavigation(request) || url.pathname === '/index.html' || url.pathname === '/version.json') {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(() => caches.match('/index.html')),
    );
    return;
  }

  if (url.pathname === '/sw.js') {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  if (isHashedAsset(url)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  event.respondWith(fetch(request));
});
