import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkPlantuml from "@mstroppel/remark-local-plantuml";

const nextConfig: NextConfig = {
  /* config options here */
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@vault/*': './vault/*',
    };
    
    // Ignore all non-markdown files in vault directory
    config.module.rules.push({
      test: /vault\/.*(?<!\.mdx?)$/,
      type: 'asset/resource',
      generator: {
        emit: false,
      },
    });
    
    return config;
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkFrontmatter, remarkGfm, remarkMath, remarkPlantuml],
    rehypePlugins: [[rehypeKatex, { strict: true, throwOnError: true }]]
  }
})

export default withMDX(nextConfig);
