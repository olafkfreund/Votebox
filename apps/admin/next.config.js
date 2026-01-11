/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: {
      enabled: true,
    },
  },
  images: {
    domains: ['i.scdn.co', 'mosaic.scdn.co'],
    formats: ['image/avif', 'image/webp'],
  },
  transpilePackages: ['@votebox/types', '@votebox/database'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;
