import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkPlantuml from "@mstroppel/remark-local-plantuml";

const nextConfig: NextConfig = {
  /* config options here */
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  turbopack: {
    resolveAlias: {
      '@vault/*': './vault/*',
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@vault/*': './vault/*',
    };
    return config;
  },
};

const withMDX = createMDX({
  options: {}
})

export default withMDX(nextConfig);
