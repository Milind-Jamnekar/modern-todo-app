/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const apiDomain = apiUrl ? new URL(apiUrl).host : null;

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/types', '@repo/ui'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', apiDomain].filter(Boolean),
    },
  },
};

module.exports = nextConfig;
