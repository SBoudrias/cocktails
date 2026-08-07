import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/cocktails',
  reactStrictMode: true,
  typedRoutes: true,
  experimental: {
    cpus: 8,
    staticGenerationMaxConcurrency: 4,
    // A warm cache only speeds up compilation (~2s of a ~19s build). Static
    // export regenerates all 4409 pages every time, and that dominates. Warm
    // builds measured no faster than cold ones, and the cache is 75MB (58MB
    // compressed) to carry between CI runs, so it is not worth restoring.
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
