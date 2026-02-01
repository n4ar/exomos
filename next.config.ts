import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow larger file uploads (100MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
    // Proxy body size limit for API routes (renamed from middlewareClientMaxBodySize)
    proxyClientMaxBodySize: 100 * 1024 * 1024, // 100MB in bytes
  },
  // External packages for server
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
