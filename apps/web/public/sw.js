// Service worker for the Indexotica static export.
//
// The precache manifest and build version are baked into out/sw.js after the
// static export by apps/web/tools/generate-sw-precache.ts; this committed
// placeholder is never served to browsers unbaked (registration is
// production-only, see instrumentation-client.ts).

const VERSION = '__SW_VERSION__';
const PRECACHE = [];

// Caches are per-origin, not per-scope, and PR previews share this origin
// with production. Every cache name is prefixed with the SW's own scope so a
// preview's SW can never see, fill, or delete a production cache (and vice
// versa), and the activate cleanup below only ever touches its own namespace.
const PREFIX = `cocktail-index:${self.registration.scope}:`;
const PRECACHE_NAME = `${PREFIX}precache-${VERSION}`;
// The runtime cache is deliberately NOT versioned: a visited page's HTML
// references that deploy's hashed /_next/ chunks, so cached pages and the
// chunk set they need must survive a deploy together — a versioned runtime
// cache would orphan every page visited before an update, making the
// offline experience reset on each deploy. Network-first means online
// visits still refresh entries in place. Growth is bounded by usage: shared
// app chunks live in the (versioned) precache, so each deploy only adds
// the delta chunks of pages visited after it, and the browser evicts the
// origin's storage under pressure.
const RUNTIME_NAME = `${PREFIX}runtime`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE_NAME);
      // 'reload' on every precache fetch: the install must see the
      // origin's bytes, never the HTTP cache — GitHub Pages serves
      // everything with max-age=600, so a fresh window would bake the
      // previous deploy's page or data file into this version's precache.
      // Fetched in place of cache.addAll, which reads the HTTP cache.
      await Promise.all(
        PRECACHE.map(async (url) => {
          const request = new URL(url, self.registration.scope);
          const response = await fetch(request, { cache: 'reload' });
          if (!response.ok) {
            throw new Error(`precache fetch failed: ${url} -> ${response.status}`);
          }
          await cache.put(request, response);
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      const retired = names.filter(
        (name) =>
          name.startsWith(PREFIX) && name !== PRECACHE_NAME && name !== RUNTIME_NAME,
      );
      // Before deleting a retired cache (an old deploy's precache, or an old
      // versioned runtime cache from before this name was stabilized), fold
      // its entries into the stable runtime cache. Retired precaches hold
      // that deploy's hashed /_next/ chunks — the assets the pages cached
      // offline from that deploy still reference — so without this step,
      // every page visited before an update would break offline.
      await Promise.all(
        retired.map(async (name) => {
          const cache = await caches.open(name);
          const entries = await cache.keys();
          await Promise.all(
            entries.map(async (request) => {
              const response = await cache.match(request);
              // cacheFirst only serves /_next/ from the runtime cache;
              // networkFirst serves everything else it holds. Old precache
              // pages (the shell, the fallback) and data files refresh
              // online first anyway, so keeping them simply widens what
              // works offline — never serving anything stale while online.
              if (response?.ok) {
                await cachePut(RUNTIME_NAME, request, response);
              }
            }),
          );
          await caches.delete(name);
        }),
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
// Fresh when online; the last cached response when offline. Returns
// `undefined` on a miss so each caller picks its own fallback. The global
// `caches.match` is safe here: cache names are namespaced per scope, and a
// URL embeds its scope's base path, so it can only match this SW's own
// entries.
async function networkFirst(request, matchOptions) {
  try {
    // 'no-cache' revalidates with the origin every time: GitHub Pages
    // sends max-age=600 on these files (the search index, data files,
    // navigated documents), and a plain fetch() honors it — a page
    // loaded minutes after a deploy would otherwise serve yesterday's
    // bytes from the HTTP cache even though the network was reachable.
    const response = await fetch(request, { cache: 'no-cache' });
    if (response.ok) {
      await cachePut(RUNTIME_NAME, request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request, matchOptions)) ?? undefined;
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

// The detail routes whose pages are all copies of one exported shell
// (apps/web/tools/stamp-detail-pages.ts): a page path under the scope, and
// its shell's path. The page renders its own entry of its type's data file
// (precached too), so the shell answers every page of the type offline.
const DETAIL_SHELLS = [
  { pattern: /^ingredient\/[^/]+\/[^/]+$/, shell: 'ingredient/_/_' },
];

function getRoute(url, scope) {
  return url.pathname.slice(scope.pathname.length).replace(/\/+$/, '');
}

// The shell of a detail page navigation, or undefined.
function getDetailShell(url, scope) {
  const route = getRoute(url, scope);
  return DETAIL_SHELLS.find(({ pattern }) => pattern.test(route))?.shell;
}

// The shell's copy of a detail page's RSC payload — `<page>.txt` or
// `<page>/__next.*.txt` — as a precache URL, or undefined.
function getDetailShellPayload(url, scope) {
  const route = getRoute(url, scope);
  for (const { pattern, shell } of DETAIL_SHELLS) {
    if (route.endsWith('.txt') && pattern.test(route.slice(0, -'.txt'.length))) {
      return new URL(`${shell}.txt`, scope).href;
    }
    const slash = route.lastIndexOf('/');
    const name = route.slice(slash + 1);
    if (name.startsWith('__next.') && pattern.test(route.slice(0, slash))) {
      return new URL(`${shell}/${name}`, scope).href;
    }
  }
  return undefined;
}

// The update toast (components/pwa/pwa-toasts) sends this when the user
// picks "Update": the waiting worker stops waiting and starts controlling
// the page on the reload that follows.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

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
    // Offline, in order: the page if it was visited before (ignoring the
    // query string), then a precached route page — navigations use clean
    // URLs (/list/recipes) while precached pages are stored at their file
    // form (/list/recipes.html; the home page at the scope root) — and
    // otherwise the offline fallback page. A real network response, 404
    // included, is always passed through as-is: only an offline miss
    // (undefined) falls back.
    const offline = new URL('offline.html', scope).href;
    const scopePath = scope.pathname.replace(/\/+$/, '');
    const cleanPath = url.pathname.replace(/\/+$/, '');
    const page =
      cleanPath === scopePath
        ? new URL('./', scope).href
        : new URL(`${cleanPath}.html`, scope).href;
    const shell = getDetailShell(url, scope);
    event.respondWith(
      networkFirst(request, { ignoreSearch: true }).then(async (response) => {
        if (response) return response;
        return (
          (await caches.match(page)) ??
          (shell && (await caches.match(new URL(`${shell}.html`, scope).href))) ??
          (await caches.match(offline)) ??
          Response.error()
        );
      }),
    );
    return;
  }

  // A detail page's RSC payloads (a soft navigation or a prefetch): offline,
  // the precached shell's payload of the same name stands in, since every
  // page's payloads are copies of the shell's.
  const shellPayload = getDetailShellPayload(url, scope);
  if (shellPayload) {
    event.respondWith(
      networkFirst(request, { ignoreSearch: true }).then(
        async (response) =>
          response ??
          (await caches.match(shellPayload, { ignoreSearch: true })) ??
          Response.error(),
      ),
    );
    return;
  }

  if (url.pathname.startsWith(`${scope.pathname}_next/`)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(
    networkFirst(request).then((response) => response ?? Response.error()),
  );
});
