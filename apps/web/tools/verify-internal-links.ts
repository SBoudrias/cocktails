import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Post-export gate: no emitted page may link to a page the deploy does not
 * serve. The About-card bar links shipped broken (#627) — a plain `<a>`
 * carried no basePath, so the link resolved to a path the deploy never
 * serves. Reading the emitted bytes catches every internal link however its
 * href was computed (a literal, a URL factory, a template string), which no
 * lint rule over source can.
 *
 *   node apps/web/tools/verify-internal-links.ts [export-dir]
 *
 * Runs as part of `yarn workspace @cocktails/web build` (the export must
 * exist). FAILS LOUDLY on any internal anchor href that misses the export's
 * basePath or points at a page the export does not contain. No new
 * dependencies: the export is HTML files on disk.
 */

/** The URL path an emitted file serves ("/" for the root index.html). */
function routeOf(relativeFilePath: string): string {
  const stripped = relativeFilePath.replace(/\.html$/, '');
  return stripped === 'index' ? '/' : `/${stripped}`;
}

/**
 * An anchor href to check: site-internal path hrefs only. External URLs (any
 * scheme or protocol-relative), hash-only anchors and empty hrefs are out —
 * they cannot fail to resolve against the export.
 */
function extractInternalHrefs(html: string): string[] {
  const hrefs: string[] = [];
  for (const match of html.matchAll(/<a\b[^>]*?\shref="([^"]*)"/g)) {
    const href = match[1]!;
    if (href === '' || /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) continue;
    hrefs.push(href);
  }
  return hrefs;
}

/** One emitted page's internal anchor hrefs, with the page's URL path. */
type PageLinks = { route: string; hrefs: string[] };

async function collectPageLinks(dir: string, pagePath: string): Promise<PageLinks[]> {
  const pages: PageLinks[] = [];

  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      pages.push(
        ...(await collectPageLinks(
          path.join(dir, entry.name),
          pagePath === '' ? entry.name : `${pagePath}/${entry.name}`,
        )),
      );
    } else if (entry.name.endsWith('.html')) {
      const file = pagePath === '' ? entry.name : `${pagePath}/${entry.name}`;
      const html = await readFile(path.join(dir, entry.name), 'utf8');
      pages.push({ route: routeOf(file), hrefs: extractInternalHrefs(html) });
    }
  }

  return pages;
}

/**
 * Check every internal anchor href in a static export. Returns one failure
 * line per href that is not an absolute path under the basePath pointing at
 * an emitted page; an empty array is a clean export.
 */
export async function verifyInternalLinks(
  outDir: string,
  basePath: string,
): Promise<string[]> {
  const pages = await collectPageLinks(outDir, '');

  if (pages.length === 0) {
    return [`${outDir} holds no HTML pages — run the build first`];
  }

  const routes = new Set(pages.map((page) => page.route));
  const failures: string[] = [];

  for (const { route, hrefs } of pages) {
    for (const href of hrefs) {
      const [rawPath] = href.split(/[?#]/, 1);
      const pathPart = rawPath ?? '';

      if (pathPart === '') continue; // a pure query or hash href

      if (!pathPart.startsWith('/')) {
        failures.push(`${route}: href="${href}" is not an absolute path`);
        continue;
      }

      // Absolute-path hrefs must carry the export's basePath: a deploy only
      // serves pages under it, and a href without it 404s (#627).
      if (pathPart !== basePath && !pathPart.startsWith(`${basePath}/`)) {
        failures.push(`${route}: href="${href}" is missing the basePath ${basePath}`);
        continue;
      }

      const target = (
        pathPart === basePath ? '/' : pathPart.slice(basePath.length)
      ).replaceAll('%20', ' ');

      if (!routes.has(target)) {
        failures.push(`${route}: href="${href}" — the export has no page at ${target}`);
      }
    }
  }

  return failures;
}

// CLI entry: resolve the export dir and basePath the same way the build
// does, report, and exit non-zero on any failure.
if (process.argv[1] === import.meta.filename) {
  const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..');
  const [exportDirArg] = process.argv.slice(2);
  const outDir = exportDirArg
    ? path.resolve(exportDirArg)
    : path.join(repoRoot, 'apps', 'web', 'out');
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/cocktails';

  const failures = await verifyInternalLinks(outDir, basePath);

  if (failures.length > 0) {
    console.error(`\n${failures.length} broken internal link(s):`);
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
  }

  console.log(`internal links ok (${basePath})`);
}
