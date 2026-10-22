import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'http', // Allow HTTP
        hostname: '**', // Match any hostname
        port: '', // Match any port
        pathname: '**', // Match any path
      },
      {
        protocol: 'https', // Allow HTTPS
        hostname: '**', // Match any hostname
        port: '', // Match any port
        pathname: '**', // Match any path
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/voting/hasil/:path*',
        destination: '/voting',
        permanent: true,
      },
      {
        source: '/voting/hasil',
        destination: '/voting',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
