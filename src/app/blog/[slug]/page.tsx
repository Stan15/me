import { findBlogPostBySlug, getAllBlogSlugs } from "@/lib/vault-scanner";

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await findBlogPostBySlug(slug);
  
  const { default: Post } = await import(`@vault/${post.filePath}`)

  return <Post />
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await findBlogPostBySlug(slug);

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      type: 'article',
      publishedTime: post.frontmatter.published,
      tags: post.frontmatter.tags,
    }
  }
}

export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs()
  return slugs.map((slug) => ({ slug }))
}
export const dynamicParams = false;
