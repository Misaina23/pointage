import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Réseaux locaux autorisés à joindre les ressources de développement (_next/hmr).
  // Un motif `*` remplace exactement un libellé de nom d'hôte.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.*.*",
    "172.*.*.*",
    "169.254.*.*",
    "10.*.*.*",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.mesupres.gov.mg",
        pathname: "/assets/front/images/logo/**",
      },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.POINTA_BACKEND_URL?.replace(/\/+$/, "");

    if (!backendUrl) {
      return [];
    }

    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/sanctum/:path*",
        destination: `${backendUrl}/sanctum/:path*`,
      },
    ];
  },
};

export default nextConfig;