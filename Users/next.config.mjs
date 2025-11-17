/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This key is reserved for Next.js experimental features.
    // 'allowedDevOrigins' is not one of them.
  },
  // 'allowedDevOrigins' should be a top-level property.
  allowedDevOrigins: ["*.cloudworkstations.dev"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
          protocol: 'https',
          hostname: 'picsum.photos',
      }
    ],
  },
};

export default nextConfig;
