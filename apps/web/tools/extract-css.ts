import fs from 'node:fs';
import path from 'node:path';

/**
 * Externalizes the inline emotion <style> blocks that the Next.js static
 * export writes into every page. A ~4,800-page export carries the same ~54 KB
 * of MUI/emotion CSS inline in each page (~212 MB of the deploy) while only
 * ~120 distinct blocks (~3.3 MB) exist across the whole export.
 *
 * Each distinct block is written once to `_next/static/css/inline-<hash>.css`
 * and the page's `<style>` is replaced by a `<link>` reusing the page's
 * basePath. Tiny blocks (<200 bytes) stay inline: they are per-page and not
 * worth a request each.
 *
 * Verified pixel-identical before/after (screenshot diff) and error-free
 * through a full client-side navigation session.
 */

const STYLE_RE = /<style[^>]*>([\s\S]*?)<\/style>/g;
const BASE_PATH_RE =
  /<link rel="stylesheet" href="([^"]*_next\/static\/chunks\/[^"]*\.css)"/;
const MIN_BLOCK_BYTES = 200;
const SHARED_CSS_DIR = '_next/static/css';

/** Stable non-cryptographic digest used only to name the shared css files. */
function contentHash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    h1 = (h1 ^ code) * 0x01000193;
    h2 = (h2 + code * (i + 1)) * 0x85ebca6b;
  }
  const a = (h1 >>> 0).toString(16).padStart(8, '0');
  const b = (h2 >>> 0).toString(16).padStart(8, '0');
  return a + b;
}

export type ExtractedCss = {
  html: string;
  /** shared filename (no directory) -> css content, one entry per distinct block */
  blocks: Map<string, string>;
};

export function extractInlineCss(html: string): ExtractedCss {
  // The basePath is the prefix before `_next/static/` in any existing
  // external css link; falls back to '/' when a page has none.
  const externalCssHref = html.match(BASE_PATH_RE)?.[1];
  const basePath = externalCssHref
    ? externalCssHref.slice(0, externalCssHref.indexOf('_next/static/'))
    : '/';

  const blocks = new Map<string, string>();

  const rewritten = html.replace(STYLE_RE, (match, css: string) => {
    const trimmed = css.trim();
    if (trimmed.length < MIN_BLOCK_BYTES) return match;

    const hash = contentHash(trimmed);
    const filename = `inline-${hash}.css`;
    if (!blocks.has(filename)) blocks.set(filename, trimmed);
    return `<link rel="stylesheet" href="${basePath}${SHARED_CSS_DIR}/${filename}"/>`;
  });

  return { html: rewritten, blocks };
}

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'pr-preview') continue;
      files.push(...walk(p));
    } else {
      files.push(p);
    }
  }
  return files;
}

function main(): void {
  const outDir = path.resolve(process.cwd(), process.argv[2] ?? 'out');
  if (!fs.existsSync(outDir)) {
    console.error(`extract-css: output directory not found: ${outDir}`);
    process.exit(1);
  }

  let pages = 0;
  let bytesRemoved = 0;
  const shared = new Map<string, string>();

  for (const file of walk(outDir).filter((f) => f.endsWith('.html'))) {
    const html = fs.readFileSync(file, 'utf8');
    const { html: rewritten, blocks } = extractInlineCss(html);
    if (rewritten === html) continue;

    fs.writeFileSync(file, rewritten);
    bytesRemoved += html.length - rewritten.length;
    pages++;
    for (const [filename, css] of blocks) {
      if (!shared.has(filename)) shared.set(filename, css);
    }
  }

  const cssDir = path.join(outDir, ...SHARED_CSS_DIR.split('/'));
  fs.mkdirSync(cssDir, { recursive: true });
  for (const [filename, css] of shared) {
    fs.writeFileSync(path.join(cssDir, filename), css);
  }

  const mb = (bytesRemoved / 1048576).toFixed(1);
  console.log(
    `extract-css: ${pages} pages rewritten, ${shared.size} shared css files, ${mb} MB of inline css removed`,
  );
}

const invokedAsScript =
  process.argv[1] !== undefined &&
  URL.canParse(`file://${process.argv[1]}`) &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (invokedAsScript) main();
