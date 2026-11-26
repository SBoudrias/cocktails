/**
 * The route param of every detail route's exported shell: the build renders
 * `/recipes/_/_/_`, `/ingredient/_/_` and `/category/_` once each, then
 * copies them to every
 * page URL of their type (tools/stamp-detail-pages.ts, which mirrors this
 * value, as do next-sitemap.config.js and public/sw.js). No data slug
 * starts with an underscore, so a shell never shadows a real page.
 */
export const DETAIL_SHELL_PARAM = '_';
