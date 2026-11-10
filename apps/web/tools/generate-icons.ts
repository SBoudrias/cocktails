import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Generate the PWA icon set from the app's identity: a carved tiki mug with a
 * paper umbrella, in the tiki-night palette the app theme is built on
 * (moonlight gold mug on the starry-night background, turquoise canopy).
 *
 * All shapes are plain SVG geometry, composed around the canvas center so the
 * maskable variant fits the 80% safe-zone circle. Sizes: maskable 512,
 * plain 512 and 192, and 180 apple-touch-icon. All PNG, opaque.
 *
 * Run from the repo root: node apps/web/tools/generate-icons.ts
 * Writes into apps/web/public/icons/. Commit the result.
 */

const BACKGROUND = '#0A1420'; // app background: dark starry night sky
const MOON_DISC = '#0F1E2E'; // subtle depth behind the mug
const GOLD = '#E8B84D'; // mug: warm moonlight glow
const GOLD_DARK = '#C89A2F'; // mug walls, rim, umbrella shaft
const GROOVE = '#8A661B'; // etched lines (brow, chin)
const RUM = '#6B3F1F'; // the drink in the mug
const TEAL = '#5DBDBD'; // umbrella canopy: turquoise ocean water
const TEAL_DARK = '#2A8A8A'; // canopy ribs

/**
 * The scene, drawn in a 512x512 box centered on (256, 256). `scale` shrinks
 * the whole composition around the center for the maskable safe zone.
 */
function scene(scale: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" fill="${BACKGROUND}"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <circle cx="256" cy="265" r="215" fill="${MOON_DISC}"/>
    <path d="M 330 124 L 285 205" stroke="${GOLD_DARK}" stroke-width="9" stroke-linecap="round"/>
    <path d="M 262 124 q 17 16 34 0 q 17 16 34 0 q 17 16 34 0 q 17 16 34 0 A 69 69 0 1 0 262 124 Z" fill="${TEAL}"/>
    <path d="M 330 67 L 296 124 M 330 67 L 364 124" stroke="${TEAL_DARK}" stroke-width="5" stroke-linecap="round"/>
    <path d="M 330 66 L 330 42" stroke="${TEAL}" stroke-width="9" stroke-linecap="round"/>
    <path d="M 146 210 L 366 210 L 346 416 Q 346 430 332 430 L 180 430 Q 166 430 166 416 Z" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="6"/>
    <path d="M 182 246 l 14 12 l 14 -12 l 14 12 l 14 -12 l 14 12 l 14 -12 l 14 12 l 14 -12 l 14 12 l 14 -12 l 14 12" fill="none" stroke="${GROOVE}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 172 292 Q 204 274 236 292 Q 204 312 172 292 Z" fill="${BACKGROUND}"/>
    <path d="M 276 292 Q 308 274 340 292 Q 308 312 276 292 Z" fill="${BACKGROUND}"/>
    <path d="M 244 268 L 268 268 L 272 330 Q 256 340 240 330 Z" fill="${BACKGROUND}"/>
    <rect x="196" y="352" width="120" height="38" rx="10" fill="${BACKGROUND}"/>
    <rect x="206" y="352" width="14" height="38" fill="${GOLD}"/>
    <rect x="230" y="352" width="14" height="38" fill="${GOLD}"/>
    <rect x="254" y="352" width="14" height="38" fill="${GOLD}"/>
    <rect x="278" y="352" width="14" height="38" fill="${GOLD}"/>
    <rect x="302" y="352" width="14" height="38" fill="${GOLD}"/>
    <path d="M 192 408 Q 256 400 320 408" stroke="${GROOVE}" stroke-width="8" stroke-linecap="round" fill="none"/>
    <ellipse cx="256" cy="210" rx="110" ry="20" fill="${GOLD_DARK}"/>
    <ellipse cx="256" cy="210" rx="92" ry="13" fill="${RUM}"/>
  </g>
</svg>`;
}

const iconsDir = path.join(import.meta.dirname, '..', 'public', 'icons');

const targets: { file: string; size: number; scale: number }[] = [
  // Maskable: the umbrella tip reaches r~226 from center at scale 1, so 0.88
  // keeps every pixel inside the 80% safe-zone circle (r 204).
  { file: 'maskable-512.png', size: 512, scale: 0.88 },
  { file: 'icon-512.png', size: 512, scale: 1 },
  { file: 'icon-192.png', size: 192, scale: 1 },
  { file: 'apple-touch-icon.png', size: 180, scale: 1 },
];

await mkdir(iconsDir, { recursive: true });
for (const { file, size, scale } of targets) {
  const svg = Buffer.from(scene(scale));
  await writeFile(
    path.join(iconsDir, file),
    await sharp(svg).resize(size, size).png().toBuffer(),
  );
}
