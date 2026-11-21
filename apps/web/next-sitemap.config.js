/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: 'https://sboudrias.github.io/cocktails',
  generateRobotsTxt: true,
  outDir: 'out',
  // The offline fallback is an internal service-worker page, not site
  // content (also noindex in app/offline/page.tsx).
  // The old non-alcoholic list URL only forwards to its style page.
  exclude: ['/offline', '/list/non-alcoholic'],
};

export default config;
