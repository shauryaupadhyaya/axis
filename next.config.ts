import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Syllabus/chapter PDF uploads are sent as base64 Server Action
      // arguments, which are ~33% larger than the raw file and would
      // otherwise hit Next's default 1MB body cap.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
