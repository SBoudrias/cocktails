import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/cocktails';

const manifest: MetadataRoute.Manifest = {
  name: 'Cocktail Index',
  short_name: 'Cocktail Index',
  description:
    'Browse thousands of cocktail recipes from books, bars, YouTube channels and podcasts, with ingredients, substitutes and calculators.',
  id: `${basePath}/`,
  start_url: `${basePath}/`,
  scope: `${basePath}/`,
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#0A1420',
  theme_color: '#0A1420',
  icons: [
    {
      src: `${basePath}/icons/icon-192.png`,
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: `${basePath}/icons/icon-512.png`,
      sizes: '512x512',
      type: 'image/png',
    },
    {
      src: `${basePath}/icons/maskable-512.png`,
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};

export function GET() {
  return Response.json(manifest);
}
