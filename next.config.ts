import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Lettertype voor de PDF-downloads (wordt van schijf gelezen).
  outputFileTracingIncludes: {
    "/**/pdf": ["./src/lib/pdf/fonts/*.woff"],
    "/**/pdf/*": ["./src/lib/pdf/fonts/*.woff"],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
