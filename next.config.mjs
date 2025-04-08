const isProd = process.env.NODE_ENV === "production";
const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined;
const basePath =
  isProd && !isTauri ? "/datasites/tauquir@openmined.org/syftui" : "";

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
  // TODO: Remove this once all the build errors are fixed
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
};

export default nextConfig;
