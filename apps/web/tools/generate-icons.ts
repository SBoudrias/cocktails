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
 * This script FAILS LOUDLY: if any icon cannot be written, or what lands on
 * disk is not the exact size and PNG format expected, it exits non-zero with
 * a message naming the file and the problem.
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
 * The scene, drawn in a 512x512 box centered on (256, 256): a large carved
 * tiki mug with a paper cocktail umbrella tucked into the drink — a shallow
 * scalloped canopy on a thin stem, tilted ~16° along the stem so it leans
 * over the mug's right shoulder. `scale` shrinks the whole composition
 * around the center for the maskable safe zone.
 */
function scene(scale: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" fill="${BACKGROUND}"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <circle cx="256" cy="270" r="205" fill="${MOON_DISC}"/>
    <g transform="translate(292 202) rotate(16)">
      <path d="M 0 10 L 0 -118" stroke="${GOLD_DARK}" stroke-width="6" stroke-linecap="round"/>
      <path d="M 0 -112 Q -55 -100 -88 -62 Q -66 -48 -44 -62 Q -22 -48 0 -62 Q 22 -48 44 -62 Q 66 -48 88 -62 Q 55 -100 0 -112 Z" fill="${TEAL}"/>
      <path d="M 0 -112 L -44 -62 M 0 -112 L 0 -62 M 0 -112 L 44 -62" stroke="${TEAL_DARK}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="0" cy="-120" r="7" fill="${TEAL}"/>
    </g>
    <path d="M 126 195 L 386 195 L 364 448 Q 364 460 350 460 L 162 460 Q 148 460 148 448 Z" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="6"/>
    <path d="M 168 232 l 13 12 l 13 -12 l 13 12 l 13 -12 l 13 12 l 13 -12 l 13 12 l 13 -12 l 13 12 l 13 -12 l 13 12 l 13 -12 l 13 12 l 13 -12 l 13 12" fill="none" stroke="${GROOVE}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 166 280 q 34 -20 68 0 q -34 24 -68 0 Z" fill="${BACKGROUND}"/>
    <path d="M 278 280 q 34 -20 68 0 q -34 24 -68 0 Z" fill="${BACKGROUND}"/>
    <path d="M 242 252 L 270 252 L 274 318 Q 256 328 238 318 Z" fill="${BACKGROUND}"/>
    <rect x="196" y="338" width="120" height="40" rx="10" fill="${BACKGROUND}"/>
    <rect x="206" y="338" width="14" height="40" fill="${GOLD}"/>
    <rect x="230" y="338" width="14" height="40" fill="${GOLD}"/>
    <rect x="254" y="338" width="14" height="40" fill="${GOLD}"/>
    <rect x="278" y="338" width="14" height="40" fill="${GOLD}"/>
    <rect x="302" y="338" width="14" height="40" fill="${GOLD}"/>
    <path d="M 190 418 Q 256 408 322 418" stroke="${GROOVE}" stroke-width="8" stroke-linecap="round" fill="none"/>
    <ellipse cx="256" cy="195" rx="130" ry="24" fill="${GOLD_DARK}"/>
    <ellipse cx="256" cy="195" rx="108" ry="15" fill="${RUM}"/>
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
  const target = path.join(iconsDir, file);
  try {
    const svg = Buffer.from(scene(scale));
    await writeFile(target, await sharp(svg).resize(size, size).png().toBuffer());
  } catch (error) {
    throw new Error(
      `failed to generate ${target}: ${error instanceof Error ? error.message : error}`,
      { cause: error },
    );
  }

  // Verify what landed on disk: exact size and PNG format. A wrong-size or
  // wrong-format icon breaks installability silently otherwise.
  const meta = await sharp(target).metadata();
  if (meta.format !== 'png' || meta.width !== size || meta.height !== size) {
    throw new Error(
      `verification failed for ${target}: expected ${size}x${size} PNG, got ${meta.width}x${meta.height} ${meta.format ?? 'unknown'}`,
    );
  }
}
