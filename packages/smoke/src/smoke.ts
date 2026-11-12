#!/usr/bin/env -S node --no-warnings

/**
 * Post-deploy smoke test: fetch a deployed copy of the site and fail loudly
 * if it is not live, or if its pages are broken.
 *
 *   yarn workspace @cocktails/smoke smoke <deployed-base-url> [absolute-local-out-dir]
 *
 * With a local out dir, the script first waits until the deployed home page
 * references the same hashed `/_next/static/` assets as the local build, so a
 * stale copy of the previous deploy (GitHub Pages lags the push by a minute or
 * two, and a push by another PR cancels the publish in flight, so under load it
 * can take several minutes) can never pass for the new one.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const LIVE_TIMEOUT_MS = Number(process.env.SMOKE_LIVE_TIMEOUT_S ?? 8 * 60) * 1000;
const LIVE_POLL_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;
const MIN_HTML_BYTES = 5_000;
const MIN_SEARCH_INDEX_ENTRIES = 100;

const [baseArg, outDir] = process.argv.slice(2);
if (!baseArg) {
  console.error('usage: smoke <deployed-base-url> [local-out-dir]');
  process.exit(2);
}

const base = new URL(baseArg.endsWith('/') ? baseArg : `${baseArg}/`);
// The path the app was built with, e.g. "/cocktails/" or "/cocktails/pr-preview/pr-12/".
const basePath = base.pathname;
// Cache buster: GitHub Pages' CDN may hold the previous deploy for minutes.
const bust = String(Date.now());

async function get(path: string): Promise<{ status: number; body: string }> {
  const url = new URL(path, base);
  url.searchParams.set('smoke', bust);
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { 'Cache-Control': 'no-cache' },
  });
  // Only read the body of a successful response: an error page proves nothing.
  return { status: res.status, body: res.ok ? await res.text() : '' };
}

function assetsOf(html: string) {
  return new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) ?? []);
}

async function waitUntilLive() {
  const deadline = Date.now() + LIVE_TIMEOUT_MS;
  const expected = outDir
    ? assetsOf(await readFile(join(outDir, 'index.html'), 'utf8'))
    : null;
  if (expected?.size === 0) {
    throw new Error(`${outDir}/index.html references no /_next/static assets`);
  }

  let last = 'no response yet';
  while (Date.now() < deadline) {
    try {
      const { status, body } = await get('');
      const deployed = assetsOf(body);
      const stale = expected ? [...expected].filter((asset) => !deployed.has(asset)) : [];
      if (status === 200 && stale.length === 0) return;
      last =
        status !== 200
          ? `home page returned ${status}`
          : `home page still serves a previous deploy (missing ${stale.length} of ${expected?.size} assets, e.g. ${stale[0]})`;
    } catch (error) {
      last = `home page fetch failed: ${error instanceof Error ? error.message : error}`;
    }
    console.log(`waiting for deploy to go live: ${last}`);
    await new Promise((resolve) => setTimeout(resolve, LIVE_POLL_MS));
  }
  throw new Error(`deploy never went live at ${base}: ${last}`);
}

const failures: string[] = [];

function hasMarker(body: string, marker: string | RegExp) {
  return typeof marker === 'string' ? body.includes(marker) : marker.test(body);
}

async function checkPage(path: string, markers: (string | RegExp)[]) {
  const label = `/${path}`;
  try {
    const { status, body } = await get(path);
    if (status !== 200) return failures.push(`${label}: HTTP ${status}`);
    if (body.length < MIN_HTML_BYTES) {
      return failures.push(`${label}: only ${body.length} bytes`);
    }
    const missing = ['<header', /<title>Cocktail Index/, ...markers].filter(
      (marker) => !hasMarker(body, marker),
    );
    if (missing.length > 0) {
      return failures.push(`${label}: missing marker(s) ${missing.join(', ')}`);
    }
    // The not-found boundary is embedded in every page's payload, so match the 404 <title> only.
    if (body.includes('<title>404')) {
      return failures.push(`${label}: renders the 404 page`);
    }
    console.log(`ok  ${label}`);
  } catch (error) {
    failures.push(`${label}: ${error instanceof Error ? error.message : error}`);
  }
}

async function main() {
  await waitUntilLive();

  // Home page: the static HTML must contain the header and the nav links.
  await checkPage('', [`href="${basePath}list/recipes"`]);

  // Search index route: valid JSON, plenty of recipes with search text.
  let recipePath: string | undefined;
  let recipeName: string | undefined;
  try {
    const { status, body } = await get('data/search-index.json');
    if (status !== 200) throw new Error(`HTTP ${status}`);
    const index: Record<string, { name?: string; searchText?: string; kind?: string }> =
      JSON.parse(body);
    const entries = Object.entries(index);
    if (entries.length < MIN_SEARCH_INDEX_ENTRIES) {
      throw new Error(`only ${entries.length} entries`);
    }
    if (entries.some(([, v]) => !v.name || !v.searchText)) {
      throw new Error('entries without a name or searchText');
    }
    // Recipes are the entries with no entity kind: pick one with a plain name
    // (no HTML-escaped characters), to look up in its page.
    const plain = entries.find(
      ([href, v]) =>
        v.kind == null &&
        href.startsWith('/recipes/') &&
        /^[A-Za-z0-9 ]+$/.test(v.name ?? ''),
    );
    recipePath = plain?.[0].replace(/^\//, '');
    recipeName = plain?.[1].name;
    console.log(`ok  /data/search-index.json (${entries.length} recipes)`);
  } catch (error) {
    failures.push(
      `/data/search-index.json: ${error instanceof Error ? error.message : error}`,
    );
  }

  // Sitemap: lists every page; pick one deep page per type from it.
  let sitemapUrls: string[] = [];
  try {
    const { status, body } = await get('sitemap-0.xml');
    if (status !== 200) throw new Error(`HTTP ${status}`);
    sitemapUrls = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].flatMap((m) =>
      m[1] ? [m[1]] : [],
    );
    if (sitemapUrls.length === 0) throw new Error('no <loc> entries');
    console.log(`ok  /sitemap-0.xml (${sitemapUrls.length} urls)`);
  } catch (error) {
    failures.push(`/sitemap-0.xml: ${error instanceof Error ? error.message : error}`);
  }
  // Sitemap URLs carry the production host and base path: keep the route only.
  const firstOf = (type: string) =>
    sitemapUrls
      .map((url) => url.replace(/^.*?\/cocktails\//, ''))
      .find((route) => route.startsWith(`${type}/`));

  if (recipePath && recipeName) {
    await checkPage(recipePath, [recipeName]);
  } else if (failures.length === 0) {
    failures.push('search index has no recipe to open');
  }
  const category = firstOf('category');
  const ingredient = firstOf('ingredient');
  if (category) await checkPage(category, []);
  else failures.push('sitemap lists no /category/ page');
  if (ingredient) await checkPage(ingredient, []);
  else failures.push('sitemap lists no /ingredient/ page');
  await checkPage('list/ingredients', []);
  await checkPage('list/recipes', []);

  if (failures.length > 0) {
    for (const failure of failures) console.error(`::error::smoke: ${failure}`);
    console.error(`\nSMOKE FAILED (${failures.length}) at ${base}`);
    process.exit(1);
  }
  console.log(`\nSmoke passed at ${base}`);
}

main().catch((error) => {
  console.error(`::error::smoke: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
