import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cocktail Index',
    display: 'standalone',
    orientation: 'portrait',
  };
}
