/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  async redirects() {
    return [
      {
        source: '/rankings',
        destination: '/companies',
        permanent: true,
      },
      {
        source: '/rankings/:path*',
        destination: '/companies/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
