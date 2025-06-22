import { getAllBlogPosts } from "@/lib/vault-scanner";
import Link from "next/link";

export default async function Blog() {
  const posts = await getAllBlogPosts();

  return <>
    <div className="flex flex-col gap-4">
      {posts.map(post => {
        return <Link key={post.slug} href={`/blog/${post.slug}`} className="block p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <h2 className="text-2xl font-bold">{post.frontmatter.title}</h2>
          <p className="text-gray-600 dark:text-gray-400">{post.frontmatter.description}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">{new Date(post.frontmatter.published).toLocaleDateString()}</p>
        </Link>
      })}
    </div >
  </>
}
