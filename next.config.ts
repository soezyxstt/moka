import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
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
};

export default nextConfig;
