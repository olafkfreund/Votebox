/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: {
      enabled: true,
    },
  },
  images: {
    domains: ['i.scdn.co', 'mosaic.scdn.co'], // Spotify image CDN
    formats: ['image/avif', 'image/webp'],
  },
  // Transpile shared packages
  transpilePackages: ['@votebox/types', '@votebox/database'],
  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
};

module.exports = nextConfig;
