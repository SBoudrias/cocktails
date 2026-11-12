// Service worker for the Cocktail Index static export.
//
// The precache manifest and build version are baked into out/sw.js after the
// static export by apps/web/tools/generate-sw-precache.ts; this committed
// placeholder is never served to browsers unbaked (registration is
// production-only, see instrumentation-client.ts).

const VERSION = 'd84ea6406b99';
const PRECACHE = [
  "./_next/static/NZw5prCxUHpbWmTdPERmO/_buildManifest.js",
  "./_next/static/NZw5prCxUHpbWmTdPERmO/_clientMiddlewareManifest.js",
  "./_next/static/NZw5prCxUHpbWmTdPERmO/_ssgManifest.js",
  "./_next/static/chunks/015yxrvhsuulq.js",
  "./_next/static/chunks/04fevq3-u7g1d.js",
  "./_next/static/chunks/07uqip6zrdo5-.js",
  "./_next/static/chunks/07vy1nalhdt3h.js",
  "./_next/static/chunks/0cz1d0mv5g_q7.js",
  "./_next/static/chunks/0d3-u__x65tx0.css",
  "./_next/static/chunks/0ge5cm88edx_5.js",
  "./_next/static/chunks/0k5k_lo9tikal.js",
  "./_next/static/chunks/0na_ggn-8--bl.js",
  "./_next/static/chunks/0p8qs-ip89wmg.js",
  "./_next/static/chunks/0v4bwg3y452cf.js",
  "./_next/static/chunks/12cy4r9qmsu1g.js",
  "./_next/static/chunks/13ng7jw-4bxi4.js",
  "./_next/static/chunks/148jepf6ue7sv.js",
  "./_next/static/chunks/1517yvkwpa-0-.js",
  "./_next/static/chunks/184hh0tc6d9pz.js",
  "./_next/static/chunks/19rydouqv-g86.js",
  "./_next/static/chunks/1__8svdd-ks7o.js",
  "./_next/static/chunks/1i8z1_fokh7co.js",
  "./_next/static/chunks/1iz9o8s16-x-p.js",
  "./_next/static/chunks/1ktxt5b29ydf3.js",
  "./_next/static/chunks/1md8wveqb6r1i.js",
  "./_next/static/chunks/1myxbybgdmv23.js",
  "./_next/static/chunks/1tf4etm58a6li.css",
  "./_next/static/chunks/1ubcoj_row524.js",
  "./_next/static/chunks/224uaqx1ep466.js",
  "./_next/static/chunks/24i4uqkup96c4.js",
  "./_next/static/chunks/25s_tlyt9ja5e.js",
  "./_next/static/chunks/2buhjdf43b2qw.js",
  "./_next/static/chunks/2cmlta-lm2x4n.js",
  "./_next/static/chunks/2flqqbaywepyl.js",
  "./_next/static/chunks/2g-5isrz18yde.js",
  "./_next/static/chunks/2mp234xta14c0.js",
  "./_next/static/chunks/2wfh68imv_rei.js",
  "./_next/static/chunks/34vawro5zoude.js",
  "./_next/static/chunks/34xf9m6qcd2jc.css",
  "./_next/static/chunks/35lk0rmgq9cxl.js",
  "./_next/static/chunks/3cef1ozj-rk9l.js",
  "./_next/static/chunks/3cgmqfrzbs-ki.js",
  "./_next/static/chunks/3gba6z7-39y7-.js",
  "./_next/static/chunks/3hsbq7h_aggve.css",
  "./_next/static/chunks/3oer7fzk43a1k.js",
  "./_next/static/chunks/3q9tad44ip413.js",
  "./_next/static/chunks/3qdu33eidxc8k.js",
  "./_next/static/chunks/3xfdo5qp25y68.js",
  "./_next/static/chunks/43go7536q7xo3.js",
  "./_next/static/chunks/turbopack-1_68p7q-2hv-0.js",
  "./_next/static/css/inline-027e604400000000.css",
  "./_next/static/css/inline-054fe1bc00000000.css",
  "./_next/static/css/inline-0719039c00000000.css",
  "./_next/static/css/inline-074a562400000000.css",
  "./_next/static/css/inline-0927a00000000000.css",
  "./_next/static/css/inline-107979fc00000000.css",
  "./_next/static/css/inline-11fa7d6800000000.css",
  "./_next/static/css/inline-164f543400000000.css",
  "./_next/static/css/inline-18dc0a9b00000000.css",
  "./_next/static/css/inline-1cd0a32400000000.css",
  "./_next/static/css/inline-1ed390a800000000.css",
  "./_next/static/css/inline-20b0f52a00000000.css",
  "./_next/static/css/inline-22cf67b800000000.css",
  "./_next/static/css/inline-2445e44400000000.css",
  "./_next/static/css/inline-257649b000000000.css",
  "./_next/static/css/inline-273eff2700000000.css",
  "./_next/static/css/inline-27be7f9c00000000.css",
  "./_next/static/css/inline-28006f3000000000.css",
  "./_next/static/css/inline-29e7a29800000000.css",
  "./_next/static/css/inline-2c69e2eb00000000.css",
  "./_next/static/css/inline-32416fdc00000000.css",
  "./_next/static/css/inline-3325bdc800000000.css",
  "./_next/static/css/inline-341cf95400000000.css",
  "./_next/static/css/inline-3454187000000000.css",
  "./_next/static/css/inline-34cfb6b000000000.css",
  "./_next/static/css/inline-3510fe6c00000000.css",
  "./_next/static/css/inline-3537ba7f00000000.css",
  "./_next/static/css/inline-372132eb00000000.css",
  "./_next/static/css/inline-3fabc24400000000.css",
  "./_next/static/css/inline-40e49ef400000000.css",
  "./_next/static/css/inline-4131842400000000.css",
  "./_next/static/css/inline-41ade7ac00000000.css",
  "./_next/static/css/inline-4563049000000000.css",
  "./_next/static/css/inline-466cb19400000000.css",
  "./_next/static/css/inline-4a5aa51000000000.css",
  "./_next/static/css/inline-4b37a27800000000.css",
  "./_next/static/css/inline-4c3c648c00000000.css",
  "./_next/static/css/inline-506cb32800000000.css",
  "./_next/static/css/inline-517deb3800000000.css",
  "./_next/static/css/inline-5a0844ab00000000.css",
  "./_next/static/css/inline-5bed002300000000.css",
  "./_next/static/css/inline-5cf5eeec00000000.css",
  "./_next/static/css/inline-5da5cf0000000000.css",
  "./_next/static/css/inline-5de808e300000000.css",
  "./_next/static/css/inline-60cfe45700000000.css",
  "./_next/static/css/inline-6294939c00000000.css",
  "./_next/static/css/inline-636da62400000000.css",
  "./_next/static/css/inline-694d891c00000000.css",
  "./_next/static/css/inline-6ea9b31700000000.css",
  "./_next/static/css/inline-6f2fc93000000000.css",
  "./_next/static/css/inline-6fb65c8000000000.css",
  "./_next/static/css/inline-740384c000000000.css",
  "./_next/static/css/inline-7432964b00000000.css",
  "./_next/static/css/inline-7af4864000000000.css",
  "./_next/static/css/inline-7c9b26f800000000.css",
  "./_next/static/css/inline-7d8b874f00000000.css",
  "./_next/static/css/inline-7da77a1000000000.css",
  "./_next/static/css/inline-8093c4bc00000000.css",
  "./_next/static/css/inline-86125c4700000000.css",
  "./_next/static/css/inline-8e53d86800000000.css",
  "./_next/static/css/inline-9576d0a800000000.css",
  "./_next/static/css/inline-9606e97000000000.css",
  "./_next/static/css/inline-9d57033c00000000.css",
  "./_next/static/css/inline-a33b710300000000.css",
  "./_next/static/css/inline-a3788c0800000000.css",
  "./_next/static/css/inline-ab32661600000000.css",
  "./_next/static/css/inline-abbfa5a000000000.css",
  "./_next/static/css/inline-abe765bf00000000.css",
  "./_next/static/css/inline-ae6d409200000000.css",
  "./_next/static/css/inline-b17f864000000000.css",
  "./_next/static/css/inline-b440a35000000000.css",
  "./_next/static/css/inline-b7b90c3400000000.css",
  "./_next/static/css/inline-b93c9f2f00000000.css",
  "./_next/static/css/inline-bc5860ef00000000.css",
  "./_next/static/css/inline-bcb3cd0000000000.css",
  "./_next/static/css/inline-be462a4000000000.css",
  "./_next/static/css/inline-bec3b24c00000000.css",
  "./_next/static/css/inline-c179d65000000000.css",
  "./_next/static/css/inline-c51eab4400000000.css",
  "./_next/static/css/inline-c633bdbb00000000.css",
  "./_next/static/css/inline-c794472800000000.css",
  "./_next/static/css/inline-c79a769c00000000.css",
  "./_next/static/css/inline-c8410d5400000000.css",
  "./_next/static/css/inline-cdea0b2800000000.css",
  "./_next/static/css/inline-d45ccf5c00000000.css",
  "./_next/static/css/inline-d68c305c00000000.css",
  "./_next/static/css/inline-d90f65bf00000000.css",
  "./_next/static/css/inline-dac4d12b00000000.css",
  "./_next/static/css/inline-dd8a4d5400000000.css",
  "./_next/static/css/inline-de531cac00000000.css",
  "./_next/static/css/inline-df0c6c3800000000.css",
  "./_next/static/css/inline-df659ea000000000.css",
  "./_next/static/css/inline-e43a8a0f00000000.css",
  "./_next/static/css/inline-e74af58000000000.css",
  "./_next/static/css/inline-ebadab1800000000.css",
  "./_next/static/css/inline-ecb9a08c00000000.css",
  "./_next/static/css/inline-edcf979300000000.css",
  "./_next/static/css/inline-f086798000000000.css",
  "./_next/static/css/inline-f3f1481c00000000.css",
  "./_next/static/css/inline-f412e92800000000.css",
  "./_next/static/css/inline-f73f689c00000000.css",
  "./_next/static/css/inline-f842aed800000000.css",
  "./_next/static/css/inline-f910b6d400000000.css",
  "./_next/static/css/inline-f96f877000000000.css",
  "./_next/static/media/194ba805cef72e7e-s.0lvk2smlqz3yc.woff2",
  "./_next/static/media/2443b96ca66c6483-s.0fd-fjxmcxcjd.woff2",
  "./_next/static/media/2617c56fc138c6bf-s.42l_3z3944ji5.woff2",
  "./_next/static/media/a3ad4672c526c1cc-s.1rlxnzisjz_e1.woff2",
  "./_next/static/media/a5a75dae7d876226-s.2dzaija1uhw5g.woff2",
  "./_next/static/media/c5f006ccf96c15fe-s.p.0a0h245ktd4x0.woff2",
  "./_next/static/media/d4349f340f06b775-s.026ae5sgholss.woff2",
  "./_next/static/media/d6011c29c416d5c4-s.1lnyw1zsxhp0r.woff2",
  "./_next/static/media/e91a3f372062aa7f-s.1szw2e8s5ktgm.woff2",
  "./_next/static/media/favicon.2vob68tjqpejf.ico",
  "./_next/static/media/tiki-beach-divider.1v4p5zstk0e-x.webp",
  "./_next/static/media/tiki-leaves-top.0hdkd5j86nsyg.webp",
  "./data/catalog.json",
  "./data/search-index.json",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./",
  "./list/authors.html",
  "./list/bars.html",
  "./list/bottles.html",
  "./list/ingredients.html",
  "./list/milk-clarification.html",
  "./list/non-alcoholic.html",
  "./list/recently-added.html",
  "./list/recipes.html",
  "./offline.html"
];

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
      await cache.addAll(PRECACHE);
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
              if (response && response.ok) {
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
    const response = await fetch(request);
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
    event.respondWith(
      networkFirst(request, { ignoreSearch: true }).then((response) => {
        if (response) return response;
        return caches
          .match(page)
          .then(
            (cached) =>
              cached ??
              caches.match(offline).then((fallback) => fallback ?? Response.error()),
          );
      }),
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
