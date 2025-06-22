import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    // Add any custom components or overrides here
    // For example:
    // h1: (props) => <h1 style={{ color: 'blue' }} {...props} />,
  };
}
