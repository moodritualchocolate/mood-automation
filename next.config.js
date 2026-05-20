/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@resvg/resvg-js', 'satori'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

module.exports = nextConfig;
