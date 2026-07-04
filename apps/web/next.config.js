/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/cocktails',
  reactStrictMode: true,
  experimental: {
    cpus: 8,
    staticGenerationMaxConcurrency: 4,
  },
  // TODO: enable
  // typedRoutes: true,
};

export default nextConfig;
