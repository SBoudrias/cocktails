import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export function GET() {
  const manifest: MetadataRoute.Manifest = {
    name: 'Cocktail Index',
    short_name: 'Cocktail Index',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0A1420',
    theme_color: '#0A1420',
  };

  return Response.json(manifest);
}
