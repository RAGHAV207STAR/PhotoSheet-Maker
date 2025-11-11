/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        '6000-firebase-studio-1760423353153.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev',
      ],
    },
  },
};

export default nextConfig;
