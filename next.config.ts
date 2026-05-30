import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // fluent-ffmpeg is a CJS server-only module — keep it out of the client bundle.
  serverExternalPackages: ["fluent-ffmpeg", "sharp"],
};

export default nextConfig;
