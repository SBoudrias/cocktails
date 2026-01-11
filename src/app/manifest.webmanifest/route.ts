import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export function GET() {
  const manifest: MetadataRoute.Manifest = {
    name: 'Cocktail Index',
    short_name: 'Cocktail Index',
    display: 'standalone',
    orientation: 'portrait',
  };

  return Response.json(manifest);
}
