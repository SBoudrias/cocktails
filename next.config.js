/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/cocktails',
  reactStrictMode: true,
  // TODO: enable
  // typedRoutes: true,
};

export default nextConfig;
