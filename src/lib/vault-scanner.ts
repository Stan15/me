import fs from 'fs';
import path from 'path';
import { walkDirectoryWithFilter } from './utils';
import matter from "gray-matter";

export interface PostFrontmatter {
  blog?: boolean;
  title: string;
  description: string;
  status: 'published' | 'draft' | 'idea';
  published: string;
  updated?: string;
  category?: string;
  tags?: string[];
  slug?: string;
}

interface BlogPostDescription {
  slug: string;
  filePath: string;
  frontmatter: PostFrontmatter;
}

interface BlogSlugMap {
  [slug: string]: BlogPostDescription;
}

export async function findBlogPostBySlug(slug: string) {
  return (await getBlogSlugMap())[slug];
}

export async function getAllBlogSlugs() {
  return Object.keys(await getBlogSlugMap())
}

export async function getAllBlogPosts() {
  const posts = Object.values(await getBlogSlugMap())
  return posts.toSorted(blog => {
    return new Date(blog.frontmatter.published).getTime()
  });
}

let _cachedSlugMap: BlogSlugMap | null = null;
async function getBlogSlugMap() {
  if (_cachedSlugMap === null) {
    _cachedSlugMap = await createBlogSlugMap();
  }
  return _cachedSlugMap;
}

async function createBlogSlugMap() {
  const slugMap: BlogSlugMap = {};
  const vaultPath = path.join(process.cwd(), 'vault')
  const markdownFiles = await walkDirectoryWithFilter(vaultPath, ["md", "mdx"]);
  for (const markdownFile of markdownFiles) {
    const relativePath = path.relative(vaultPath, markdownFile);
    let frontmatter = extractFrontmatter(markdownFile);

    let displayBlog = frontmatter.blog;
    if (process.env.NODE_ENV === 'production') {
      displayBlog &&= frontmatter.status === 'published';
    }
    if (!displayBlog) continue;

    const slug = frontmatter.slug || createSlugNameFromFilePath(relativePath)
    if (slugMap[slug]) {
      throw new Error(`Duplicate slug "${slug}" found:\n  - ${slugMap[slug].filePath}\n  - ${markdownFile}\n\nPlease ensure each post has a unique title or add a unique 'slug' field to the frontmatter.`)
    }
    slugMap[slug] = {
      slug,
      filePath: relativePath,
      frontmatter,
    }
  }

  return slugMap;
}

function createSlugNameFromFilePath(filePath: string) {
  const filename = path.basename(filePath, path.extname(filePath));
  return filename.replace(/[^A-Za-z0-9]+/gi, '-').toLowerCase();
}

function extractFrontmatter(markdownFilePath: string): PostFrontmatter {
  const markdownContent = fs.readFileSync(markdownFilePath, 'utf8')

  try {
    return matter(markdownContent).data as PostFrontmatter;
  } catch (error) {
    // Extract first few lines of the file for context
    const lines = markdownContent.split('\n').slice(0, 10);
    const preview = lines.map((line, i) => `${i + 1}: ${line}`).join('\n');

    throw new Error(
      `Failed to parse YAML frontmatter in file: ${markdownFilePath}\n\n` +
      `Error: ${error instanceof Error ? error.message : String(error)}\n\n` +
      `File preview (first 10 lines):\n${preview}\n\n` +
      `Please check the YAML syntax in the frontmatter section (between --- markers).`
    );
  }
}
