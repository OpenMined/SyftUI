/** @type {import('next').NextConfig} */

const basePath =
  process.env.NODE_ENV === "production"
    ? "/datasites/tauquir@openmined.org/syftui"
    : "";

// Make basePath available to the client as an environment variable
process.env.NEXT_PUBLIC_BASE_PATH = basePath;

const nextConfig = {
  output: "export",
  basePath,
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
