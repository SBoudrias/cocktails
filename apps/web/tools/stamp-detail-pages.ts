import { access, copyFile, mkdir, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Copy each detail route's exported shell to every page URL of its type.
 * Chained onto the workspace build script right after `next build`, so the
 * sitemap, the service worker's deploy stamp and the link check all see the
 * full set of pages.
 *
 * `next build` renders each detail route once, at the shell param
 * (`/ingredient/_/_`, see modules/detailShell.ts); the page renders its own
 * entry of its type's data file in the browser, picked by its path. Every
 * page is therefore a byte-identical copy of its shell:
 *
 * - `<route>.html`, what a landing (or a crawler) loads;
 * - `<route>.txt` and the `<route>/__next.*.txt` payloads, what the client
 *   router fetches on a soft navigation and a prefetch.
 *
 * Identical copies cost the deploy one upload each (the Netlify uploader
 * deduplicates by content hash), so the export's unique files no longer
 * grow with the data.
 *
 * The pages come from the type's data file in the export: its `pages`
 * keys are the page paths. This script FAILS LOUDLY on a missing shell or
 * data file, or a page path outside its route.
 *
 * Run from the repo root: node apps/web/tools/stamp-detail-pages.ts
 */

const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..');
const outDir = path.join(repoRoot, 'apps', 'web', 'out');

// Mirrors DETAIL_SHELL_PARAM in modules/detailShell.ts.
const SHELL_PARAM = '_';

const DETAIL_ROUTES = [
  {
    dataFile: path.join('data', 'ingredients.json'),
    shell: `ingredient/${SHELL_PARAM}/${SHELL_PARAM}`,
    pattern: /^\/ingredient\/[^/]+\/[^/]+$/,
  },
  {
    dataFile: path.join('data', 'recipes.json'),
    shell: `recipes/${SHELL_PARAM}/${SHELL_PARAM}/${SHELL_PARAM}`,
    pattern: /^\/recipes\/[^/]+\/[^/]+\/[^/]+$/,
  },
  {
    dataFile: path.join('data', 'categories.json'),
    shell: `category/${SHELL_PARAM}`,
    pattern: /^\/category\/[^/]+$/,
  },
];

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function readPagePaths(dataFile: string): Promise<string[]> {
  const file = path.join(outDir, dataFile);
  if (!(await exists(file))) {
    throw new Error(`${dataFile} not found in out/ — run \`next build\` first`);
  }
  const data: { pages?: Record<string, unknown> } = JSON.parse(
    await readFile(file, 'utf8'),
  );
  if (data.pages == null) {
    throw new Error(`${dataFile} has no "pages" record`);
  }
  return Object.keys(data.pages);
}

async function stampRoute({
  dataFile,
  shell,
  pattern,
}: (typeof DETAIL_ROUTES)[number]): Promise<number> {
  const shellHtml = path.join(outDir, `${shell}.html`);
  const shellTxt = path.join(outDir, `${shell}.txt`);
  const shellDir = path.join(outDir, shell);
  const shellFiles = [shellHtml, shellTxt, shellDir];
  const present = await Promise.all(shellFiles.map(exists));
  const missing = shellFiles.filter((_, index) => !present[index]);
  if (missing.length > 0) {
    throw new Error(
      `shell output missing: ${missing.map((file) => path.relative(outDir, file)).join(', ')} — the route must export its shell param`,
    );
  }
  const payloads = (await readdir(shellDir)).filter((name) => name.endsWith('.txt'));

  const pagePaths = await readPagePaths(dataFile);
  const invalid = pagePaths.filter((pagePath) => !pattern.test(pagePath));
  if (invalid.length > 0) {
    throw new Error(`${dataFile} holds paths outside its route: ${invalid.join(', ')}`);
  }

  await Promise.all(
    pagePaths.map(async (pagePath) => {
      const route = path.join(outDir, pagePath.slice(1));
      await mkdir(route, { recursive: true });
      await Promise.all([
        copyFile(shellHtml, `${route}.html`),
        copyFile(shellTxt, `${route}.txt`),
        ...payloads.map((name) =>
          copyFile(path.join(shellDir, name), path.join(route, name)),
        ),
      ]);
    }),
  );

  return pagePaths.length;
}

try {
  const counts = await Promise.all(DETAIL_ROUTES.map(stampRoute));
  for (const [index, route] of DETAIL_ROUTES.entries()) {
    console.log(`stamped ${counts[index]} pages from ${route.shell}`);
  }
} catch (error) {
  console.error(
    `stamp-detail-pages failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}
