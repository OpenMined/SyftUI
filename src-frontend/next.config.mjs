const isProd = process.env.NODE_ENV === "production";
const isDesktopBuild = process.env.IS_DESKTOP_BUILD !== undefined;
const basePath = isProd && !isDesktopBuild ? "/syftui" : "";

// Make basePath available to the client as an environment variable
process.env.NEXT_PUBLIC_BASE_PATH = basePath;
process.env.NEXT_PUBLIC_APTABASE_KEY = "A-US-0801581295";

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
