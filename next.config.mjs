import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  basePath: "/docs",
  async redirects() {
    return [
      {
        source: "/v2/retrieval/search-theory",
        destination: "/v2/retrieval/search/theory",
        permanent: true,
      },
      {
        source: "/v2/retrieval/search-plugins",
        destination: "/v2/retrieval/search/levels",
        permanent: true,
      },
      {
        source: "/v2/retrieval/catalog-search",
        destination: "/v2/retrieval/search/catalog-personalization",
        permanent: true,
      },
    ];
  },
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
