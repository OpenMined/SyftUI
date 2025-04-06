const isProd = process.env.NODE_ENV === "production";
const basePath = isProd ? "/datasites/tauquir@openmined.org/syftui" : "";

// Make basePath available to the client as an environment variable
process.env.NEXT_PUBLIC_BASE_PATH = basePath;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: basePath,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
};

export default nextConfig;
