/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/types', '@repo/ui'],
  output: 'standalone',
  // Tell Next.js to trace files from the monorepo root so it correctly
  // bundles 'next' and other deps from root node_modules into standalone
  outputFileTracingRoot: path.join(__dirname, '../../'),
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
};

module.exports = nextConfig;
