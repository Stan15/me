import path from 'path';
import { walkDirectoryWithFilter, extractRawFrontmatter, createSlugNameFromFilePath } from './utils';

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
    let rawFrontmatter = extractRawFrontmatter(markdownFile);

    let displayBlog = Boolean(rawFrontmatter.blog);
    if (process.env.NODE_ENV === 'production') {
      displayBlog &&= rawFrontmatter.status === 'published';
    }
    if (!displayBlog) continue;

    // Only validate and normalize frontmatter for blog posts
    const frontmatter = validateAndNormalizeFrontmatter(rawFrontmatter, markdownFile);

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

function validateAndNormalizeFrontmatter(rawData: any, filePath: string): PostFrontmatter {
  const validateDate = (dateValue: any, fieldName: string): string => {
    if (!dateValue) {
      throw new Error(`Blog post "${filePath}" is missing required field: ${fieldName}`);
    }
    const dateStr = String(dateValue);
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Blog post "${filePath}" has invalid ${fieldName}: "${dateStr}". Please use a valid date format.`);
    }
    return dateStr;
  };

  return {
    blog: Boolean(rawData.blog),
    title: String(rawData.title || ''),
    description: String(rawData.description || ''),
    status: rawData.status,
    published: validateDate(rawData.published, 'published'),
    updated: rawData.updated ? validateDate(rawData.updated, 'updated') : undefined,
    category: rawData.category ? String(rawData.category) : undefined,
    tags: Array.isArray(rawData.tags) ? rawData.tags : (rawData.tags ? [String(rawData.tags)] : undefined),
    slug: rawData.slug ? String(rawData.slug) : undefined,
  };
}
