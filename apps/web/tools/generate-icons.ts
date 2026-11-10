import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Generate the PWA icon set from the app's identity: a LocalBar glyph on the
 * app's dark background color. The glyph is the same Material Symbols path
 * the header and footer use, so the installed icon matches the in-app brand.
 *
 * Sizes: maskable 512 (full-bleed with safe-zone padding), plain 512 and 192
 * (smaller glyph padding), and 180 apple-touch-icon. All PNG, opaque.
 *
 * Run from the repo root: node apps/web/tools/generate-icons.ts
 * Writes into apps/web/public/icons/. Commit the result.
 */

const BACKGROUND = '#0A1420';
const GLYPH = '#E8B84D';
// Material Symbols "local_bar" path (24x24 view box), shared with AppHeader.
const GLYPH_PATH = 'M21 5V3H3v2l8 9v5H6v2h12v-2h-5v-5zM7.43 7 5.66 5h12.69l-1.78 2z';

const iconsDir = path.join(import.meta.dirname, '..', 'public', 'icons');

// Scale the 24-unit glyph so its drawn height covers `drawnRatio` of the
// canvas; the glyph is 16 units tall out of its 24-unit box.
function iconSvg(size: number, drawnRatio: number): string {
  const drawn = size * drawnRatio;
  const box = (drawn / 16) * 24;
  const offset = (size - box) / 2;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">`,
    `<rect width="${size}" height="${size}" fill="${BACKGROUND}"/>`,
    `<g transform="translate(${offset} ${offset}) scale(${box / 24})">`,
    `<path d="${GLYPH_PATH}" fill="${GLYPH}"/>`,
    `</g>`,
    `</svg>`,
  ].join('');
}

const targets: { file: string; size: number; drawnRatio: number }[] = [
  // Maskable: the visible safe zone is the inner 80% circle, so the glyph
  // stays clear of any launcher crop at 70% drawn height.
  { file: 'maskable-512.png', size: 512, drawnRatio: 0.7 },
  { file: 'icon-512.png', size: 512, drawnRatio: 0.85 },
  { file: 'icon-192.png', size: 192, drawnRatio: 0.85 },
  // Apple never crops; a slightly larger glyph reads better.
  { file: 'apple-touch-icon.png', size: 180, drawnRatio: 0.9 },
];

await mkdir(iconsDir, { recursive: true });
for (const { file, size, drawnRatio } of targets) {
  const svg = Buffer.from(iconSvg(size, drawnRatio));
  await writeFile(path.join(iconsDir, file), await sharp(svg).png().toBuffer());
}
