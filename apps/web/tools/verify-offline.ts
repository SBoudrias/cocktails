#!/usr/bin/env -S node --no-warnings

/**
 * Offline verification harness for the built static export: drives headless
 * Chrome over the DevTools protocol against a local server that mirrors
 * GitHub Pages' URL layout (clean route → route.html), and asserts the full
 * offline story of the PWA end to end on the exact bytes a deploy ships.
 *
 *   node apps/web/tools/verify-offline.ts
 *
 * Run after `yarn workspace @cocktails/web build` (the export must exist and
 * its sw.js must be baked). "Offline" is real: the harness's own server
 * refuses every connection, so service worker fallbacks are exercised by
 * genuine network failures, not by emulation quirks. The matrix:
 *
 * - install: scope-namespaced cache names, a precache that holds the app
 *   shell, the catalog, the search index and the list hubs;
 * - offline on a fresh install (nothing but the home page ever visited):
 *   home, list hubs, search, the precached catalog served to pages, and the
 *   offline fallback for unvisited routes;
 * - catalog-rendered pages (category/ingredient) visited online, then offline;
 * - a simulated redeploy (new sw.js version, precache pruned of chunks the
 *   old deploy's pages reference), then offline again: pages visited before
 *   the update must still work — the runtime cache survival and the activate
 *   migration are what make that hold.
 *
 * This script FAILS LOUDLY: every failed check is named and the exit code is
 * non-zero, and a missing export, an unbaked sw.js or a missing Chrome
 * aborts before the browser starts. No new dependencies: node's built-in
 * WebSocket and fetch speak the DevTools protocol directly.
 *
 * Chrome is found via $CHROME_BIN or the usual installed paths.
 */
import { spawn } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import { access, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import http from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..');
const outDir = path.join(repoRoot, 'apps', 'web', 'out');

// The base path the export was built with — the same variable next.config.ts
// reads, so a preview build (its own base path) verifies with the same
// command. The SW scopes everything under it; the server mirrors the deploy
// layout accordingly.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/cocktails';
const NAV_TIMEOUT_MS = 30_000;
const INSTALL_TIMEOUT_MS = 90_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Pre-flight: the export must exist and be baked — this script verifies what
// a deploy ships, so it never runs against a partial output.
// ---------------------------------------------------------------------------

async function assertFile(relative: string): Promise<void> {
  try {
    await access(path.join(outDir, relative), fsConstants.F_OK);
  } catch {
    throw new Error(
      `required export file missing: apps/web/out/${relative} — run \`yarn workspace @cocktails/web build\` before this script`,
    );
  }
}

await assertFile('sw.js');
await assertFile('data/catalog.json');
await assertFile('data/search-index.json');
await assertFile('index.html');
await assertFile('offline.html');
const LIST_HUBS = [
  'list/recipes',
  'list/ingredients',
  'list/bottles',
  'list/recently-added',
  'list/authors',
  'list/bars',
  'list/non-alcoholic',
  'list/milk-clarification',
] as const;
for (const hub of LIST_HUBS) await assertFile(`${hub}.html`);

const swSource = await readFile(path.join(outDir, 'sw.js'), 'utf8');
if (swSource.includes('__SW_VERSION__') || swSource.includes('const PRECACHE = [];')) {
  throw new Error(
    'out/sw.js is not baked (placeholders present) — run `yarn workspace @cocktails/web build` before this script',
  );
}
const versionMatch = swSource.match(/const VERSION = '([^']+)';/);
if (!versionMatch) throw new Error('out/sw.js carries no baked VERSION constant');
const deployAVersion = versionMatch[1]!;

const precacheMatch = swSource.match(/const PRECACHE = (\[[\s\S]*?\n\]);/);
if (!precacheMatch) throw new Error('out/sw.js carries no baked PRECACHE array');
const precacheUrls: string[] = JSON.parse(precacheMatch[1]!);

const catalog = JSON.parse(
  await readFile(path.join(outDir, 'data/catalog.json'), 'utf8'),
) as {
  cards: Record<string, [string, string]>;
  lists: Record<string, [string, unknown][]>;
};

// The routes the harness drives, all present in the export's baked pages.
const VISITED_CATEGORY = 'category/rum';
const UNVISITED_CATEGORY = 'category/absinthe';
const VISITED_INGREDIENT = 'ingredient/juice/lime-juice';
// The author/bar pages became catalog-rendered (#554); the non-alcoholic
// list (#553) bakes no rows at all, so it can only render through the
// precached catalog — the strongest fresh-install offline check there is.
const NON_ALCOHOLIC_HUB = 'list/non-alcoholic';
const VISITED_AUTHOR = 'list/authors/anders-erickson';
const VISITED_BAR = 'list/bars/death-and-co-new-york-ny';
const rumList = catalog.lists[VISITED_CATEGORY];
const absintheList = catalog.lists[UNVISITED_CATEGORY];
if (!rumList || rumList.length < 100) {
  throw new Error(`catalog carries no usable list for ${VISITED_CATEGORY}`);
}
if (!absintheList || absintheList.length === 0) {
  throw new Error(`catalog carries no list for ${UNVISITED_CATEGORY}`);
}
if (!catalog.lists[NON_ALCOHOLIC_HUB]?.length) {
  throw new Error(`catalog carries no list for ${NON_ALCOHOLIC_HUB}`);
}
for (const route of [VISITED_AUTHOR, VISITED_BAR]) {
  const list = catalog.lists[route];
  if (!list || list.length < 20) {
    throw new Error(`catalog carries no usable list for ${route}`);
  }
}
const visitedRecipeHref = rumList[0]![0];
const visitedRecipeName = catalog.cards[visitedRecipeHref]?.[0];
const unvisitedRecipeHref =
  absintheList.map(([href]) => href).find((href) => href !== visitedRecipeHref) ?? '';
if (!visitedRecipeName || !unvisitedRecipeHref) {
  throw new Error('catalog has no recipe hrefs to drive the matrix with');
}
await assertFile(`${visitedRecipeHref.replace(/^\//, '')}.html`);
await assertFile(`${unvisitedRecipeHref.replace(/^\//, '')}.html`);
await assertFile(`${VISITED_CATEGORY}.html`);
await assertFile(`${VISITED_INGREDIENT}.html`);
await assertFile(`${UNVISITED_CATEGORY}.html`);
await assertFile(`${VISITED_AUTHOR}.html`);
await assertFile(`${VISITED_BAR}.html`);

// ---------------------------------------------------------------------------
// Chrome discovery, before anything else runs.
// ---------------------------------------------------------------------------

const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
].filter((candidate): candidate is string => typeof candidate === 'string');

const chromePath: string | undefined = CHROME_CANDIDATES.find((candidate) => {
  try {
    void access(candidate, fsConstants.F_OK | fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
});
if (!chromePath) {
  throw new Error(
    `no Chrome/Chromium binary found (tried ${CHROME_CANDIDATES.join(', ')}) — set $CHROME_BIN`,
  );
}

// ---------------------------------------------------------------------------
// The server: mirrors GitHub Pages' clean-URL resolution over the export.
// `online = false` destroys sockets — the offline phase is a real network
// failure. For the redeploy phase, an overlay directory of changed files is
// looked in first, standing in for the newly deployed build.
// ---------------------------------------------------------------------------

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

let servingRoots = [outDir];
let online = true;

const server = http.createServer((req, res) => {
  void (async () => {
    if (!online) {
      req.socket.destroy();
      return;
    }
    let pathname: string;
    try {
      pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://127.0.0.1').pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    if (!pathname.startsWith(BASE_PATH)) {
      res.writeHead(404).end('not found');
      return;
    }
    const rel = pathname.slice(BASE_PATH.length) || '/';
    const withSlash = rel.endsWith('/') ? `${rel}index.html` : rel;
    for (const candidate of [withSlash, `${withSlash}.html`, `${withSlash}/index.html`]) {
      for (const root of servingRoots) {
        const fileStat = await stat(path.join(root, candidate)).catch(() => undefined);
        if (!fileStat?.isFile()) continue;
        res
          .writeHead(200, {
            'Content-Type': MIME[path.extname(candidate)] ?? 'application/octet-stream',
            'Cache-Control': 'no-store',
          })
          .end(await readFile(path.join(root, candidate)));
        return;
      }
    }
    res.writeHead(404).end('not found');
  })().catch(() => res.destroy());
});
await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = (server.address() as { port: number }).port;
const origin = `http://127.0.0.1:${port}`;
const scopeUrl = `${origin}${BASE_PATH}/`;
const cachePrefix = `cocktail-index:${scopeUrl}:`;

// ---------------------------------------------------------------------------
// Deploy B: the redeploy simulation. Its sw.js has a new VERSION and a
// precache pruned of two chunks the old deploy's visited recipe page
// references — faithful to a redeploy whose chunk hashes changed. After the
// update, those two chunk URLs exist only in the retired precache, so the
// post-redeploy offline checks pass solely through the activate migration
// folding it into the stable runtime cache. The home page carries a marker
// comment proving the browser picked up deploy B's HTML.
// ---------------------------------------------------------------------------

const workDir = await mkdtemp(path.join(tmpdir(), 'verify-offline-'));
const overlayDir = path.join(workDir, 'overlay');
await mkdir(overlayDir);

const recipePageHtml = await readFile(
  path.join(outDir, `${visitedRecipeHref.replace(/^\//, '')}.html`),
  'utf8',
);
const referencedChunks = precacheUrls.filter(
  (url) =>
    url.startsWith('./_next/') && recipePageHtml.includes(`${BASE_PATH}${url.slice(1)}`),
);
if (referencedChunks.length < 2) {
  throw new Error('the visited recipe page references fewer than two precached chunks');
}
const droppedChunks = referencedChunks.slice(0, 2);
const deployBPrecache = precacheUrls.filter((url) => !droppedChunks.includes(url));
// Appended, never substituted: a version like 'b175…' would otherwise
// rewrite to itself ('b' + '175…' === deployAVersion), deploy B would
// reuse deploy A's precache cache name, and the retirement check below
// could never pass.
const deployBVersion = `${deployAVersion}-b`;
await writeFile(
  path.join(overlayDir, 'sw.js'),
  swSource
    .replace(
      `const VERSION = '${deployAVersion}';`,
      `const VERSION = '${deployBVersion}';`,
    )
    .replace(
      /const PRECACHE = \[[\s\S]*?\n\];/,
      `const PRECACHE = ${JSON.stringify(deployBPrecache, null, 2)};`,
    ),
);
await writeFile(
  path.join(overlayDir, 'index.html'),
  (await readFile(path.join(outDir, 'index.html'), 'utf8')).replace(
    '</head>',
    '<!--deploy-b--></head>',
  ),
);

// ---------------------------------------------------------------------------
// Chrome + the DevTools protocol, over node's built-in WebSocket.
// ---------------------------------------------------------------------------

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=0',
  `--user-data-dir=${path.join(workDir, 'chrome-profile')}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--disable-sync',
  '--disable-component-update',
  // CI runners run Chrome in a container: no sandbox namespaces and a tiny
  // /dev/shm. Harmless on a laptop, required there.
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--window-size=1280,800',
  'about:blank',
]);

const browserWsUrl = await new Promise<string>((resolve, reject) => {
  let stderrTail = '';
  const timer = setTimeout(() => {
    reject(new Error(`Chrome never printed its DevTools WebSocket URL: ${stderrTail}`));
  }, 20_000);
  chrome.stderr?.setEncoding('utf8');
  chrome.stderr?.on('data', (chunk: string) => {
    stderrTail = `${stderrTail}${chunk}`.slice(-2000);
    const match = chunk.match(/DevTools listening on (ws:\/\/\S+)/);
    if (match) {
      clearTimeout(timer);
      resolve(match[1]!);
    }
  });
  chrome.on('exit', (code) => {
    clearTimeout(timer);
    reject(
      new Error(`Chrome exited before DevTools came up (code ${code}): ${stderrTail}`),
    );
  });
});

// The DevTools HTTP endpoints live next to the browser WebSocket: same host
// and port, http scheme instead of ws.
const devtoolsOrigin = new URL(browserWsUrl).origin.replace(/^ws:/, 'http:');
const targets = (await (await fetch(`${devtoolsOrigin}/json/list`)).json()) as {
  type: string;
  url: string;
  webSocketDebuggerUrl?: string;
}[];
const pageTarget = targets.find(
  (target) => target.type === 'page' && target.webSocketDebuggerUrl,
);
if (!pageTarget?.webSocketDebuggerUrl) {
  throw new Error(`Chrome exposes no page target to drive (${targets.length} targets)`);
}

/**
 * A single DevTools protocol connection. Runtime-validated at the boundary
 * where results are consumed: helpers below throw on shape mismatches
 * instead of trusting the protocol.
 */
class Cdp {
  private readonly ws: WebSocket;
  private nextId = 1;
  private readonly pending = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  >();
  private readonly listeners = new Map<string, Set<(params: unknown) => void>>();

  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data) as {
        id?: number;
        method?: string;
        params?: unknown;
        result?: unknown;
        error?: { message: string };
      };
      if (message.id !== undefined) {
        const entry = this.pending.get(message.id);
        if (!entry) return;
        this.pending.delete(message.id);
        if (message.error !== undefined) entry.reject(new Error(message.error.message));
        else entry.resolve(message.result);
        return;
      }
      if (message.method !== undefined) {
        for (const listener of this.listeners.get(message.method) ?? []) {
          listener(message.params);
        }
      }
    });
  }

  get ready(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws.readyState === WebSocket.OPEN) return resolve();
      this.ws.addEventListener('open', () => resolve());
      this.ws.addEventListener('error', () =>
        reject(new Error('DevTools socket failed')),
      );
    });
  }

  send(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const id = this.nextId++;
    const promise = new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    void this.ws.send(JSON.stringify({ id, method, params }));
    return promise;
  }

  on(method: string, listener: (params: unknown) => void): void {
    const listeners = this.listeners.get(method) ?? new Set();
    listeners.add(listener);
    this.listeners.set(method, listeners);
  }

  close(): void {
    this.ws.close();
  }
}

const page = new Cdp(pageTarget.webSocketDebuggerUrl);
await page.ready;
await page.send('Page.enable');
await page.send('Runtime.enable');
await page.send('Network.enable');

// Same-origin request failures, by type: what a broken offline page looks
// like (a chunk or document that no cache holds). Cross-origin requests
// (fonts, embeds) are none of the service worker's business.
const requestUrls = new Map<string, { url: string; type: string }>();
const criticalFailures: string[] = [];
page.on('Network.requestWillBeSent', (params) => {
  if (typeof params !== 'object' || params === null) return;
  const { requestId, request, type } = params as {
    requestId?: string;
    request?: { url?: string };
    type?: string;
  };
  if (typeof requestId === 'string' && typeof request?.url === 'string') {
    requestUrls.set(requestId, {
      url: request.url,
      type: typeof type === 'string' ? type : '',
    });
  }
});
page.on('Network.loadingFailed', (params) => {
  if (typeof params !== 'object' || params === null) return;
  const { requestId, errorText } = params as { requestId?: string; errorText?: string };
  if (typeof requestId !== 'string' || typeof errorText !== 'string') return;
  const request = requestUrls.get(requestId);
  if (!request?.url.startsWith(origin)) return;
  if (['Document', 'Script', 'Stylesheet'].includes(request.type)) {
    criticalFailures.push(`${request.type} ${request.url}: ${errorText}`);
  }
});

// ---------------------------------------------------------------------------
// Check plumbing.
// ---------------------------------------------------------------------------

const failures: string[] = [];
let checkCount = 0;

async function check(label: string, run: () => Promise<void>): Promise<void> {
  checkCount++;
  try {
    await run();
    console.log(`ok  ${checkCount} - ${label}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${label}: ${message}`);
    console.error(`not ok  ${checkCount} - ${label}\n      ${message}`);
  }
}

/** Evaluate an expression in the page; the value's runtime type is checked. */
async function evaluateValue(expression: string): Promise<unknown> {
  const result = (await page.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })) as {
    result?: { value?: unknown };
    exceptionDetails?: { text?: string; exception?: { description?: string } };
  };
  if (result.exceptionDetails !== undefined) {
    const details = result.exceptionDetails;
    throw new Error(
      `page evaluation threw: ${details.exception?.description ?? details.text ?? 'unknown'}`,
    );
  }
  return result.result?.value;
}

async function evaluateNumber(expression: string): Promise<number> {
  const value = await evaluateValue(expression);
  if (typeof value !== 'number')
    throw new Error(`expected a number, got ${typeof value}`);
  return value;
}

async function evaluateString(expression: string): Promise<string> {
  const value = await evaluateValue(expression);
  if (typeof value !== 'string')
    throw new Error(`expected a string, got ${typeof value}`);
  return value;
}

async function evaluateStrings(expression: string): Promise<string[]> {
  const value = await evaluateValue(expression);
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw new Error('expected an array of strings');
  }
  return value;
}

function navigateTo(route: string): Promise<unknown> {
  return page.send('Page.navigate', { url: new URL(`.${route}`, scopeUrl).href });
}

/** Poll a numeric page expression until it satisfies the predicate. */
async function untilCount(
  label: string,
  expression: string,
  predicate: (count: number) => boolean,
  timeoutMs = NAV_TIMEOUT_MS,
): Promise<number> {
  const deadline = Date.now() + timeoutMs;
  let last = 0;
  while (Date.now() < deadline) {
    last = await evaluateNumber(expression).catch(() => 0);
    if (predicate(last)) return last;
    await sleep(150);
  }
  throw new Error(`timed out waiting for ${label} (last: ${last})`);
}

/** Poll a boolean page expression until true. */
async function untilTrue(
  label: string,
  expression: string,
  timeoutMs = NAV_TIMEOUT_MS,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if ((await evaluateValue(expression).catch(() => false)) === true) return;
    await sleep(150);
  }
  throw new Error(`timed out waiting for ${label}`);
}

const cacheNamesExpr = 'caches.keys()';
const recipeRowsExpr = `document.querySelectorAll('a[href*="${BASE_PATH}/recipes/"]').length`;

const setOnline = (nextOnline: boolean) => {
  online = nextOnline;
};

// ---------------------------------------------------------------------------
// Phase 0 — install on a fresh profile, then inspect the caches.
// ---------------------------------------------------------------------------

await navigateTo('/');
await untilTrue(
  'the service worker to control the page',
  '(async () => { const r = await navigator.serviceWorker.ready; return r.active !== null && navigator.serviceWorker.controller !== null; })()',
  INSTALL_TIMEOUT_MS,
);

await check('service worker installed and controlling the page', async () => {
  const scriptUrl = await evaluateString(
    '(async () => (await navigator.serviceWorker.ready).active.scriptURL)()',
  );
  if (!scriptUrl.endsWith(`${BASE_PATH}/sw.js`)) {
    throw new Error(`unexpected service worker script URL: ${scriptUrl}`);
  }
});

await check('every cache name is namespaced under the SW scope', async () => {
  const names = await evaluateStrings(cacheNamesExpr);
  const strays = names.filter((name) => !name.startsWith(cachePrefix));
  if (strays.length > 0)
    throw new Error(`caches outside the scope prefix: ${strays.join(', ')}`);
  if (!names.includes(`${cachePrefix}precache-${deployAVersion}`)) {
    throw new Error(
      `no precache cache for version ${deployAVersion}: ${names.join(', ')}`,
    );
  }
});

const precacheEntries = await evaluateStrings(
  `(async () => { const c = await caches.open('${cachePrefix}precache-${deployAVersion}'); return (await c.keys()).map(k => new URL(k.url).pathname); })()`,
);

await check(
  `precache holds the manifest (${precacheUrls.length} URLs), the catalog, the search index and every list hub`,
  async () => {
    if (precacheEntries.length !== precacheUrls.length) {
      throw new Error(
        `precache has ${precacheEntries.length} entries, the manifest bakes ${precacheUrls.length}`,
      );
    }
    for (const required of [
      `${BASE_PATH}/data/catalog.json`,
      `${BASE_PATH}/data/search-index.json`,
      `${BASE_PATH}/offline.html`,
      ...LIST_HUBS.map((hub) => `${BASE_PATH}/${hub}.html`),
    ]) {
      if (!precacheEntries.includes(required)) {
        throw new Error(`precache is missing ${required}`);
      }
    }
  },
);

// ---------------------------------------------------------------------------
// Phase 1 — offline, fresh install: nothing but the home page was ever visited.
// ---------------------------------------------------------------------------

setOnline(false);

await check('the home page renders offline', async () => {
  await navigateTo('/');
  await untilTrue('the home page to render', 'document.title.includes("Indexotica")');
});

await check('a list hub renders its rows offline (baked list)', async () => {
  await navigateTo('/list/recipes');
  // The A–Z list is virtualized (react-virtuoso) and the baked HTML carries
  // only through letter "B": rows past B render offline only if the
  // precached search index hydrated the whole list. Virtuoso grows the page
  // as it measures rows, so a single jump lands short of the end — jump to
  // the bottom repeatedly from inside the page until a "Z" recipe row
  // materializes (it does so immediately once the list is complete).
  await untilCount('recipe rows', recipeRowsExpr, (rows) => rows >= 15);
  const reachedEnd = await evaluateValue(
    `(async () => {
      for (let jump = 0; jump < 150; jump++) {
        window.scrollTo(0, document.documentElement.scrollHeight);
        await new Promise((resolve) => setTimeout(resolve, 100));
        const rows = [...document.querySelectorAll('a[href*="${BASE_PATH}/recipes/"]')];
        if (rows.some((row) => row.textContent.trim().startsWith('Z'))) return true;
      }
      return false;
    })()`,
  );
  if (reachedEnd !== true) {
    throw new Error(
      'scrolled the full list without reaching the end of the alphabet — ' +
        'rows beyond the baked first letters do not render offline',
    );
  }
});

await check(
  'a catalog-only list hub renders offline on a fresh install (no baked rows)',
  async () => {
    // The non-alcoholic hub bakes no rows at all (#553): every row comes
    // from the catalog fetch, so this only renders offline through the
    // precached data — a plain (non-virtualized) list, so rows count high.
    await navigateTo(`/${NON_ALCOHOLIC_HUB}`);
    await untilCount(
      'non-alcoholic rows',
      recipeRowsExpr,
      (count) => count >= catalog.lists[NON_ALCOHOLIC_HUB]!.length,
    );
  },
);

await check(
  'offline search filters rows through the precached search index',
  async () => {
    // "flip" is rare enough to cut the list hard (a handful of the ~2,600
    // recipes), so a short render proves filtering — not the whole list.
    await navigateTo('/list/recipes?search=flip');
    await untilTrue(
      'the URL to settle on the search',
      `(() => { const params = new URLSearchParams(location.search); return params.get('search') === 'flip'; })()`,
    );
    await untilCount(
      'filtered rows',
      recipeRowsExpr,
      (count) => count > 0 && count < 100,
    );
    const matched = await evaluateValue(
      `(() => { const rows = [...document.querySelectorAll('a[href*="${BASE_PATH}/recipes/"]')]; return rows.some((row) => row.textContent.toLowerCase().includes('flip')); })()`,
    );
    if (matched !== true) {
      throw new Error('rendered rows do not mention flip');
    }
  },
);

await check('the precached catalog serves pages offline', async () => {
  // The exact fetch the catalog-rendered pages issue: network-first over a
  // refused connection must fall back to the precached catalog.json.
  const result = await evaluateString(
    `(async () => {
      const response = await fetch('${scopeUrl}data/catalog.json');
      if (!response.ok) return 'http ' + response.status;
      const catalog = await response.json();
      return 'ok ' + Object.keys(catalog.lists ?? {}).length + ' lists';
    })()`,
  );
  if (!result.startsWith('ok ')) throw new Error(`fetch fell back badly: ${result}`);
  const listCount = Number(result.split(' ')[1]);
  if (listCount < 50) throw new Error(`catalog carries only ${listCount} lists`);
});

await check('an unvisited category page falls back to the offline page', async () => {
  await navigateTo(`/${UNVISITED_CATEGORY}`);
  await untilTrue(
    'the offline fallback',
    'document.body.innerText.includes("You are offline")',
  );
});

await check('an unvisited recipe page falls back to the offline page', async () => {
  await navigateTo(unvisitedRecipeHref);
  await untilTrue(
    'the offline fallback',
    'document.body.innerText.includes("You are offline")',
  );
});

// ---------------------------------------------------------------------------
// Phase 2 — back online, visit the catalog-rendered pages and a recipe page.
// ---------------------------------------------------------------------------

setOnline(true);

await check('a category page renders its rows online', async () => {
  await navigateTo(`/${VISITED_CATEGORY}`);
  await untilCount('category rows', recipeRowsExpr, (count) => count > 100);
});

await check('an ingredient page renders its rows online', async () => {
  await navigateTo(`/${VISITED_INGREDIENT}`);
  await untilCount('ingredient rows', recipeRowsExpr, (count) => count > 100);
});

await check('an author page renders its rows online from the catalog', async () => {
  await navigateTo(`/${VISITED_AUTHOR}`);
  await untilCount(
    'author rows',
    recipeRowsExpr,
    (count) => count >= catalog.lists[VISITED_AUTHOR]!.length,
  );
});

await check('a bar page renders its rows online from the catalog', async () => {
  await navigateTo(`/${VISITED_BAR}`);
  await untilCount(
    'bar rows',
    recipeRowsExpr,
    (count) => count >= catalog.lists[VISITED_BAR]!.length,
  );
});

await check('a recipe page opens online', async () => {
  await navigateTo(visitedRecipeHref);
  await untilTrue(
    'the recipe to render',
    `document.body.innerText.includes(${JSON.stringify(visitedRecipeName)})`,
  );
});

// Also visit the unvisited category page, so its HTML lands in the runtime
// cache before the redeploy — it must survive the redeploy offline.
await navigateTo(`/${UNVISITED_CATEGORY}`);
await untilCount('category rows', recipeRowsExpr, (count) => count > 0);

// ---------------------------------------------------------------------------
// Phase 3 — redeploy: serve deploy B and let its service worker take over.
// ---------------------------------------------------------------------------

servingRoots = [overlayDir, outDir];

await check('the redeployed home page is served', async () => {
  await navigateTo('/');
  await untilTrue(
    'deploy B to be served',
    'document.documentElement.innerHTML.includes("deploy-b")',
  );
});

await check(
  'the updated service worker installs, retires the old precache and keeps the runtime cache',
  async () => {
    await page
      .send('Runtime.evaluate', {
        expression: `navigator.serviceWorker.register('${scopeUrl}sw.js')`,
        awaitPromise: true,
      })
      .catch(() => undefined);
    const deadline = Date.now() + INSTALL_TIMEOUT_MS;
    let names: string[] = [];
    while (Date.now() < deadline) {
      names = await evaluateStrings(cacheNamesExpr);
      const hasB = names.includes(`${cachePrefix}precache-${deployBVersion}`);
      const goneA = !names.includes(`${cachePrefix}precache-${deployAVersion}`);
      if (hasB && goneA && names.includes(`${cachePrefix}runtime`)) break;
      await sleep(250);
    }
    const expected = [
      `${cachePrefix}precache-${deployBVersion}`,
      `${cachePrefix}runtime`,
    ];
    for (const name of expected) {
      if (!names.includes(name)) {
        throw new Error(
          `expected cache ${name} after the redeploy; caches: ${names.join(', ')}`,
        );
      }
    }
    if (names.includes(`${cachePrefix}precache-${deployAVersion}`)) {
      throw new Error(`the old precache was never retired: ${names.join(', ')}`);
    }
  },
);

await check('the runtime cache kept the pages visited before the redeploy', async () => {
  const kept = await evaluateValue(
    `(async () => { const c = await caches.open('${cachePrefix}runtime'); return (await c.match('${scopeUrl}${visitedRecipeHref.slice(1)}')) !== undefined; })()`,
  );
  if (kept !== true)
    throw new Error('the visited recipe page HTML is gone from the runtime cache');
});

// ---------------------------------------------------------------------------
// Phase 4 — offline again, after the redeploy.
// ---------------------------------------------------------------------------

setOnline(false);

await check(
  'the recipe page visited before the redeploy still renders offline (migrated chunks)',
  async () => {
    criticalFailures.length = 0;
    await navigateTo(visitedRecipeHref);
    await untilTrue(
      'the recipe to render',
      `document.body.innerText.includes(${JSON.stringify(visitedRecipeName)})`,
    );
    await sleep(2000); // let any broken subresource surface
    if (criticalFailures.length > 0) {
      throw new Error(`same-origin load failures: ${criticalFailures.join('; ')}`);
    }
  },
);

await check(
  'the category page visited before the redeploy still renders offline (migrated chunks)',
  async () => {
    criticalFailures.length = 0;
    await navigateTo(`/${UNVISITED_CATEGORY}`);
    await untilCount(
      'category rows',
      recipeRowsExpr,
      (count) => count > 0,
      NAV_TIMEOUT_MS,
    );
    await sleep(2000);
    if (criticalFailures.length > 0) {
      throw new Error(`same-origin load failures: ${criticalFailures.join('; ')}`);
    }
  },
);

await check('a list hub renders offline from the new deploy precache', async () => {
  criticalFailures.length = 0;
  await navigateTo('/list/ingredients');
  await untilCount(
    'ingredient hub rows',
    `document.querySelectorAll('a[href*="${BASE_PATH}/ingredient/"]').length`,
    (count) => count > 100,
  );
  await sleep(2000);
  if (criticalFailures.length > 0) {
    throw new Error(`same-origin load failures: ${criticalFailures.join('; ')}`);
  }
});

await check(
  'the author page visited before the redeploy still renders offline',
  async () => {
    criticalFailures.length = 0;
    await navigateTo(`/${VISITED_AUTHOR}`);
    await untilCount(
      'author rows',
      recipeRowsExpr,
      (count) => count >= catalog.lists[VISITED_AUTHOR]!.length,
    );
    await sleep(2000);
    if (criticalFailures.length > 0) {
      throw new Error(`same-origin load failures: ${criticalFailures.join('; ')}`);
    }
  },
);

// ---------------------------------------------------------------------------
// Report and clean up.
// ---------------------------------------------------------------------------

console.log(
  `\nverify-offline: ${checkCount - failures.length}/${checkCount} checks passed`,
);
console.log(
  `precache: ${precacheUrls.length} URLs, catalog.json ${(
    (await stat(path.join(outDir, 'data/catalog.json'))).size / 1024
  ).toFixed(0)} KB`,
);

page.close();
chrome.kill();

// Chrome writes its profile asynchronously for a moment after the kill, and
// the harness must exit with the checks' verdict — not die in cleanup. Wait
// for the process, then retry the profile removal a few times.
await new Promise<void>((resolve) => {
  if (chrome.exitCode !== null) return resolve();
  chrome.once('exit', () => resolve());
});
for (let attempt = 0; ; attempt++) {
  try {
    await rm(workDir, { recursive: true, force: true });
    break;
  } catch (error) {
    const transient = error instanceof Error && error.message.includes('ENOTEMPTY');
    if (!transient || attempt >= 4) throw error;
    await sleep(500);
  }
}
await new Promise<void>((resolve) => server.close(() => resolve()));

if (failures.length > 0) {
  console.error(`\nverify-offline FAILED (${failures.length}):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log('verify-offline passed');
process.exit(0);
