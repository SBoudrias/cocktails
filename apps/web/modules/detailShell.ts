/**
 * The route param of every detail route's exported shell: the build renders
 * `/ingredient/_/_` once, then copies it to every ingredient's URL
 * (tools/stamp-detail-pages.ts, which mirrors this value). No data slug
 * starts with an underscore, so the shell never shadows a real page.
 */
export const DETAIL_SHELL_PARAM = '_';
