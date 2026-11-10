// Service worker for the Cocktail Index static export.
//
// The precache manifest and build version are baked into out/sw.js after the
// static export by apps/web/tools/generate-sw-precache.ts. This committed
// placeholder (empty precache, 'dev' version) also serves `next dev`, where
// the SW is inert by design.

const VERSION = '__SW_VERSION__';
const PRECACHE = [];

const PRECACHE_NAME = `cocktail-index-precache-${VERSION}`;
const RUNTIME_NAME = 'cocktail-index-runtime';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE_NAME);
      await cache.addAll(PRECACHE);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name !== PRECACHE_NAME && name !== RUNTIME_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

async function cachePut(cacheName, request, response) {
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
}

// Network-first with cached fallback: for navigations, and for same-origin
// files that are not content-hashed (the search index, icons, the manifest).
// Fresh when online; the last cached response when not.
async function networkFirst(request, matchOptions) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cachePut(RUNTIME_NAME, request, response.clone());
    }
    return response;
  } catch {
    const runtime = await caches.open(RUNTIME_NAME);
    const cached =
      (await runtime.match(request, matchOptions)) ||
      (await runtime.match(request)) ||
      (await caches.match(request));
    if (cached) return cached;
    return Response.error();
  }
}

// Cache-first: for content-hashed build output under /_next/, where the URL
// changes whenever the content does.
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    await cachePut(RUNTIME_NAME, request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const scope = new URL(self.registration.scope);
  const url = new URL(request.url);

  // Only same-origin requests under the SW scope (the /cocktails basePath).
  // Anything cross-origin is left to the browser's own handling.
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) {
    return;
  }

  if (request.mode === 'navigate') {
    // Offline: the page if it was visited before (exact URL, or the
    // extensionless/HTML variant of it), otherwise the offline fallback.
    const offline = new URL('offline.html', scope).href;
    event.respondWith(
      networkFirst(request, { ignoreSearch: true }).then((response) =>
        response.ok
          ? response
          : caches.match(offline).then((fallback) => fallback ?? Response.error()),
      ),
    );
    return;
  }

  if (url.pathname.startsWith(`${scope.pathname}_next/`)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
