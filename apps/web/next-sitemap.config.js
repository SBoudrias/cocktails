import { readFile } from 'node:fs/promises';
import path from 'node:path';

const outDir = path.join(import.meta.dirname, 'out');

// The detail routes export one shell each (`/ingredient/_/_`) that the build
// copies to every page URL (tools/stamp-detail-pages.ts), so the build
// manifest next-sitemap reads only knows the shell. Each page comes from its
// type's data file instead: its `pages` keys are the page paths.
const DETAIL_SHELLS = ['/ingredient/_/_'];
const DETAIL_DATA_FILES = ['data/ingredients.json'];

/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: 'https://sboudrias.github.io/cocktails',
  generateRobotsTxt: true,
  outDir: 'out',
  // The offline fallback is an internal service-worker page, not site
  // content (also noindex in app/offline/page.tsx). The detail shells are
  // build artifacts, never linked.
  exclude: ['/offline', ...DETAIL_SHELLS],
  additionalPaths: async (sitemapConfig) => {
    const pagePaths = await Promise.all(
      DETAIL_DATA_FILES.map(async (dataFile) => {
        const data = JSON.parse(await readFile(path.join(outDir, dataFile), 'utf8'));
        return Object.keys(data.pages);
      }),
    );

    // The default transform is async, though its type says otherwise.
    return Promise.all(
      pagePaths
        .flat()
        .map(async (pagePath) => sitemapConfig.transform(sitemapConfig, pagePath)),
    );
  },
};

export default config;
