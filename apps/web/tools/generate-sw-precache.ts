import { createHash } from 'node:crypto';
import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Script } from 'node:vm';

/**
 * Bake the service worker's precache manifest and build version into the
 * built export's out/sw.js. Chained onto the workspace build script (after
 * `next build` and `next-sitemap`), so a local `yarn build` produces exactly
 * the SW that deploys.
 *
 * The committed public/sw.js holds empty placeholders; the build copies it
 * to out/, and this pass fills the placeholders from the built output. The
 * placeholder SW is never served to browsers unbaked: registration is
 * production-only (see instrumentation-client.ts), and in production this
 * pass always runs as part of the build.
 *
 * Precache is deliberately conservative — the app shell, not the site:
 * - the home page and the offline fallback HTML
 * - all _next/ static assets (JS/CSS chunks, fonts, media), hashed and safe
 * - the shared catalog (data/catalog.json) and search index
 *   (data/search-index.json): the two files every catalog-rendered list and
 *   the search page fetch at runtime, so offline browsing of those lists
 *   does not depend on having visited them online first
 * - the PWA icons
 *
 * Per-recipe/per-ingredient pages (~4,700) are NEVER precached. Navigations
 * are network-first with a cached fallback at runtime, so visited pages work
 * offline without being precached (offline = everything ever visited, across
 * deploys — the runtime cache is kept from one version to the next).
 *
 * This script FAILS LOUDLY: a missing build output, a missing required
 * file, an unbaked or already-baked sw.js, or a baked result that does not
 * parse exits non-zero with a message naming the problem, so CI never ships
 * a silently-broken offline experience.
 *
 * Run from the repo root: node apps/web/tools/generate-sw-precache.ts
 */

const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..');
const outDir = path.join(repoRoot, 'apps', 'web', 'out');
const swPath = path.join(outDir, 'sw.js');

/** A route's file form in the export: /list/recipes is emitted as recipes.html. */
const toHtmlFile = (route: string) => `${route}.html`;

// App pages served at the site root of the export. The home page is the
// precached app shell; offline.html is the offline fallback for uncached
// navigations. The /list/ hub pages are precached so the offline fallback's
// "Go to all recipes" link (and every nav destination) is a real page offline
// even on a fresh install that never visited it — each is tens of KB.
const LIST_ENTRIES = [
  'list/recipes',
  'list/ingredients',
  'list/bottles',
  'list/recently-added',
  'list/authors',
  'list/bars',
  'list/non-alcoholic',
  'list/milk-clarification',
] as const;

const PAGE_ENTRIES = ['index.html', 'offline.html', ...LIST_ENTRIES.map(toHtmlFile)];

// Shared data files served from /data/: precached in full so the lists that
// render from them work offline on a fresh install. catalog.json is ~3 MB
// raw (~280 KB gz over the wire) — the cost of the install-time cache.addAll
// is accepted for a real offline catalog.
const DATA_FILES = [
  path.join('data', 'catalog.json'),
  path.join('data', 'search-index.json'),
];

// Files the offline experience depends on: if any is missing from the
// export, the deploy would silently ship a broken PWA, so their absence is
// fatal here.
const REQUIRED_FILES = [
  ...PAGE_ENTRIES,
  ...DATA_FILES,
  path.join('icons', 'icon-192.png'),
  path.join('icons', 'icon-512.png'),
  path.join('icons', 'maskable-512.png'),
];

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? listFiles(full) : Promise.resolve([full]);
    }),
  );
  return nested.flat();
}

async function main(): Promise<void> {
  // The build output must exist: this pass runs after `next build`.
  try {
    await access(outDir);
  } catch {
    throw new Error(
      `build output not found: ${outDir} — run \`yarn workspace @cocktails/web build\` before this script`,
    );
  }

  // The build must have copied the placeholder SW into the export.
  let sw: string;
  try {
    sw = await readFile(swPath, 'utf8');
  } catch {
    throw new Error(
      `${swPath} not found — the build should copy public/sw.js into out/; check that apps/web/public/sw.js is committed and the build ran to completion`,
    );
  }

  const outFiles = await listFiles(outDir);
  const relative = outFiles.map((file) => path.relative(outDir, file));

  // Every file the offline experience needs must be present in the export.
  const missing = REQUIRED_FILES.filter((file) => !relative.includes(file));
  if (missing.length > 0) {
    throw new Error(
      `required export files missing from out/: ${missing.join(', ')} — the build output is incomplete; refusing to bake a service worker that would ship a broken offline experience`,
    );
  }

  // There must be build assets to precache: a manifest without the app's
  // JS/CSS chunks means the export is broken, not merely small.
  const assetCount = relative.filter((file) =>
    file.startsWith(`_next${path.sep}`),
  ).length;
  if (assetCount === 0) {
    throw new Error(
      'no _next/ build assets found in out/ — the static export produced no hashed assets, which should never happen; check the build logs',
    );
  }

  // Sorted once, up front: the URL list, the hash fold, and the printed
  // manifest all follow a stable order (readdir's is not guaranteed stable),
  // so two builds of identical content bake byte-identical SWs.
  const precache = relative
    .filter((file) => {
      if (PAGE_ENTRIES.includes(file)) return true;
      // Hashed build assets: JS chunks, extracted CSS, fonts, bundled media.
      if (file.startsWith(`_next${path.sep}`)) return true;
      // Shared data already served as static files.
      if (DATA_FILES.includes(file)) return true;
      // PWA icons referenced by the manifest.
      if (file.startsWith(path.join('icons') + path.sep)) return true;
      return false;
    })
    .toSorted();

  // index.html is served as /, not /index.html. Every other entry keeps its
  // file path — including the .html suffix for route pages, which is exactly
  // the form the SW's own `caches.match(offline)` looks up.
  const urls = precache.map((file) => (file === 'index.html' ? './' : `./${file}`));

  // Read each precached file once. The hash folds the pairs in list order
  // (not resolution order), so the version is deterministic across builds
  // of identical content.
  const entries = await Promise.all(
    precache.map(async (file) => {
      const content = await readFile(path.join(outDir, file));
      return [file, content] as const;
    }),
  );
  const hash = createHash('sha256');
  let bytes = 0;
  for (const [file, content] of entries) {
    hash.update(file);
    hash.update(content);
    bytes += content.length;
  }
  const version = hash.digest('hex').slice(0, 12);

  // Match the committed placeholders in public/sw.js. An already-baked SW
  // (e.g. this pass ran twice without a rebuild) fails loudly here. The
  // replacement goes through a function, so `$`/`$&` sequences in the inserted
  // JSON are kept literal instead of being interpreted as replace patterns.
  const replaceOrThrow = (
    source: string,
    pattern: RegExp,
    replacement: string,
    what: string,
  ) => {
    const updated = source.replace(pattern, () => replacement);
    if (updated === source) {
      throw new Error(
        `${what} placeholder not found in ${swPath} — the SW is missing or already baked; rebuild (public/sw.js must carry the placeholders) before running this pass again`,
      );
    }
    return updated;
  };

  const withPrecache = replaceOrThrow(
    sw,
    /const PRECACHE = \[\];/,
    `const PRECACHE = ${JSON.stringify(urls, null, 2)};`,
    'precache list',
  );
  const baked = replaceOrThrow(
    withPrecache,
    /const VERSION = '__SW_VERSION__';/,
    `const VERSION = '${version}';`,
    'version',
  );

  // The baked SW must parse: a template mistake that ships a SyntaxError
  // takes the whole site offline, so check before writing.
  new Script(baked, { filename: swPath });

  await writeFile(swPath, baked);

  // Verify what actually landed on disk matches the bake, byte for byte.
  const written = await readFile(swPath, 'utf8');
  if (written !== baked) {
    throw new Error(
      `verification failed: ${swPath} on disk does not match the baked content — the write was interrupted or the file was modified concurrently`,
    );
  }

  console.log(`precache: ${urls.length} URLs, ~${(bytes / 1024 / 1024).toFixed(1)} MB`);
  for (const url of urls) {
    console.log(`  ${url}`);
  }
}

try {
  await main();
} catch (error) {
  console.error(
    `generate-sw-precache failed: ${error instanceof Error ? error.message : error}`,
  );
  process.exit(1);
}
