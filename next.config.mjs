/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Linting is run explicitly in CI; don't fail production builds on lint.
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      // The store is a static build under public/store. Next serves files out
      // of public/ but does not resolve a directory to its index.html, so
      // /store/ redirected to /store and then 404'd — only the full
      // /store/index.html worked. This makes the clean path serve the page.
      { source: '/store', destination: '/store/index.html' },
    ];
  },
};

export default nextConfig;
