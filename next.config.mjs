import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  basePath: "/docs",
  async rewrites() {
    return [
      {
        source: "/v2/:path*.md",
        destination: "/llms.mdx/v2/:path*",
      },
      {
        source: "/v1/:path*.md",
        destination: "/llms.mdx/v1/:path*",
      },
    ];
  },
};

export default withMDX(config);
