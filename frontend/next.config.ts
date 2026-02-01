import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['forhumanai.net', 'localhost:3000'],
    },
  },
};

export default nextConfig;
