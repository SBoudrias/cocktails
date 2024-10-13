import { MetadataRoute } from 'next';

export function GET() {
  const manifest: MetadataRoute.Manifest = {
    name: 'Cocktail Index',
    short_name: 'Cocktail Index',
    display: 'standalone',
    orientation: 'portrait',
  };

  return Response.json(manifest);
}
