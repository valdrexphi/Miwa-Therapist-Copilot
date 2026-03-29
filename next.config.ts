import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the JSON body on API routes to be up to 10 MB
  // (extracted text from a 50 MB file is well under this after truncation)
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
