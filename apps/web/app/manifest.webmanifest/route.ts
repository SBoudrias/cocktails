import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const manifest: MetadataRoute.Manifest = {
  name: 'Cocktail Index',
  short_name: 'Cocktail Index',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#0A1420',
  theme_color: '#0A1420',
};

export function GET() {
  return Response.json(manifest);
}
