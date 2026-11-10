import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Bake the service worker's precache manifest and build version into the
 * built export's out/sw.js. Run AFTER `next build`, BEFORE deploy.
 *
 * The committed public/sw.js holds empty placeholders (also serving `next
 * dev`, where the SW is inert by design); the build copies it to out/, and
 * this pass fills the placeholders from the built output.
 *
 * Precache is deliberately conservative — the app shell, not the site:
 * - the home page and the offline fallback HTML
 * - all _next/ static assets (JS/CSS chunks, fonts, media), hashed and safe
 * - the shared search index (data/search-index.json)
 * - the PWA icons
 *
 * Per-recipe/per-ingredient pages (~4,700) are NEVER precached; a follow-up
 * will add the catalog data files here. Navigations are network-first with a
 * cached fallback at runtime, so visited pages work offline without being
 * precached.
 *
 * Run from the repo root: node apps/web/tools/generate-sw-precache.ts
 */

const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..');
const outDir = path.join(repoRoot, 'apps', 'web', 'out');
const swPath = path.join(outDir, 'sw.js');

// App pages served at the site root of the export. The home page is the
// fallback shell for uncached navigation URLs.
const PAGE_ENTRIES = ['index.html', 'offline.html'];

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

const outFiles = await listFiles(outDir);
const relative = outFiles.map((file) => path.relative(outDir, file));

const precache = relative.filter((file) => {
  if (PAGE_ENTRIES.includes(file)) return true;
  // Hashed build assets: JS chunks, extracted CSS, fonts, bundled media.
  if (file.startsWith(`_next${path.sep}`)) return true;
  // Shared data already served as static files.
  if (file === path.join('data', 'search-index.json')) return true;
  // PWA icons referenced by the manifest.
  if (file.startsWith(path.join('icons') + path.sep)) return true;
  return false;
});

// index.html is served as /, not /index.html. Everything else keeps its
// path, using the served URL form (no .html suffix for route pages).
const urls = precache.map((file) => (file === 'index.html' ? './' : `./${file}`)).sort();

const sw = await readFile(swPath, 'utf8');

// Version by content: any precached asset changing changes the hash, so the
// next deploy installs a fresh cache and the old one is deleted on activate.
const hash = createHash('sha256');
for (const file of precache) {
  hash.update(file);
  hash.update(await readFile(path.join(outDir, file)));
}
const version = hash.digest('hex').slice(0, 12);

// Match the committed placeholders in public/sw.js.
const replaceOrThrow = (source: string, pattern: RegExp, replacement: string) => {
  const updated = source.replace(pattern, replacement);
  if (updated === source) {
    throw new Error(`placeholder ${pattern} not found in ${swPath}`);
  }
  return updated;
};

const withPrecache = replaceOrThrow(
  sw,
  /const PRECACHE = \[\];/,
  `const PRECACHE = ${JSON.stringify(urls, null, 2)};`,
);
const withVersion = replaceOrThrow(
  withPrecache,
  /const VERSION = '__SW_VERSION__';/,
  `const VERSION = '${version}';`,
);
await writeFile(swPath, withVersion);

const bytes = (
  await Promise.all(precache.map((file) => readFile(path.join(outDir, file))))
).reduce((total, buffer) => total + buffer.length, 0);

console.log(`precache: ${urls.length} URLs, ~${(bytes / 1024 / 1024).toFixed(1)} MB`);
for (const url of urls) {
  console.log(`  ${url}`);
}
