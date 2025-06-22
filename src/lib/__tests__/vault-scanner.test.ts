import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock only the I/O operations
vi.mock('../utils', async () => {
  const actual = await vi.importActual('../utils')
  return {
    ...actual,
    walkDirectoryWithFilter: vi.fn(),
    extractRawFrontmatter: vi.fn(),
  }
})

// Helper to get fresh imports with reset cache
async function getVaultScanner() {
  vi.resetModules()
  const vaultModule = await import('../vault-scanner')
  const utilsModule = await import('../utils')
  return {
    getAllBlogPosts: vaultModule.getAllBlogPosts,
    getAllBlogSlugs: vaultModule.getAllBlogSlugs,
    findBlogPostBySlug: vaultModule.findBlogPostBySlug,
    walkDirectoryWithFilter: utilsModule.walkDirectoryWithFilter,
    extractRawFrontmatter: utilsModule.extractRawFrontmatter,
  }
}

describe('Blog System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock process.cwd to match our test file paths
    vi.spyOn(process, 'cwd').mockReturnValue('/project')
  })

  describe('Blog Filtering', () => {
    it('includes posts with blog: true', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      
      const mockFiles = ['/project/vault/post.md']
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/post.md') {
          return {
            blog: true,
            title: 'Test',
            description: 'Test desc',
            status: 'published',
            published: '2024-01-15'
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      const posts = await getAllBlogPosts()
      
      expect(walkDirectoryWithFilter).toHaveBeenCalledWith(
        expect.stringContaining('vault'),
        ['md', 'mdx']
      )
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/post.md')
      expect(posts).toHaveLength(1)
    })

    it('excludes posts with blog: false', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      
      const mockFiles = ['/project/vault/not-blog.md']
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/not-blog.md') {
          return {
            blog: false,
            title: 'Not Blog',
            status: 'published',
            published: '2024-01-15'
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      const posts = await getAllBlogPosts()
      
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/not-blog.md')
      expect(posts).toHaveLength(0)
    })

    it('excludes posts without blog field', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      
      const mockFiles = ['/project/vault/no-blog.md']
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/no-blog.md') {
          return {
            title: 'No Blog',
            status: 'published',
            published: '2024-01-15'
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      const posts = await getAllBlogPosts()
      
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/no-blog.md')
      expect(posts).toHaveLength(0)
    })

    it('coerces truthy blog values to true', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      const mockFiles = ['/project/vault/string-blog.md']
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/string-blog.md') {
          return {
            blog: 'true',
            title: 'String Blog',
            description: 'Test desc', 
            status: 'published',
            published: '2024-01-15'
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      const posts = await getAllBlogPosts()
      
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/string-blog.md')
      expect(posts).toHaveLength(1)
      expect(posts[0].frontmatter.blog).toBe(true)
    })
  })

  describe('Status Filtering', () => {
    it('shows all statuses in development', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const mockFiles = ['/project/vault/published.md', '/project/vault/draft.md']
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/published.md') {
          return {
            blog: true,
            title: 'Published',
            description: 'Published post',
            status: 'published',
            published: '2024-01-15'
          }
        }
        if (filePath === '/project/vault/draft.md') {
          return {
            blog: true,
            title: 'Draft',
            description: 'Draft post',
            status: 'draft',
            published: '2024-01-15'
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      const posts = await getAllBlogPosts()
      
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/published.md')
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/draft.md')
      expect(posts).toHaveLength(2)

      process.env.NODE_ENV = originalEnv
    })

    it('shows only published in production', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const mockFiles = ['/project/vault/published.md', '/project/vault/draft.md']
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/published.md') {
          return {
            blog: true,
            title: 'Published',
            description: 'Published post',
            status: 'published',
            published: '2024-01-15'
          }
        }
        if (filePath === '/project/vault/draft.md') {
          return {
            blog: true,
            title: 'Draft',
            description: 'Draft post',
            status: 'draft',
            published: '2024-01-15'
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      const posts = await getAllBlogPosts()
      
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/published.md')
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/draft.md')
      expect(posts).toHaveLength(1)
      expect(posts[0].frontmatter.status).toBe('published')

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Frontmatter Validation', () => {
    it('validates required published field', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      const mockFiles = ['/project/vault/no-published.md']
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/no-published.md') {
          return {
            blog: true,
            title: 'Test',
            description: 'Test desc',
            status: 'published'
            // missing published
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      await expect(getAllBlogPosts()).rejects.toThrow('missing required field: published')
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/no-published.md')
    })

    it('validates published date format', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      const mockFiles = ['/project/vault/invalid-date.md']
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/invalid-date.md') {
          return {
            blog: true,
            title: 'Test',
            description: 'Test desc',
            status: 'published',
            published: 'not-a-date'
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      await expect(getAllBlogPosts()).rejects.toThrow('invalid published')
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/invalid-date.md')
    })

    it('validates updated date format when provided', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      const mockFiles = ['/project/vault/invalid-updated.md']
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/invalid-updated.md') {
          return {
            blog: true,
            title: 'Test',
            description: 'Test desc',
            status: 'published',
            published: '2024-01-15',
            updated: 'invalid-date'
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      await expect(getAllBlogPosts()).rejects.toThrow('invalid updated')
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/invalid-updated.md')
    })

    it('accepts valid date formats', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      const mockFiles = ['/project/vault/valid-dates.md']
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/valid-dates.md') {
          return {
            blog: true,
            title: 'Valid Dates',
            description: 'Test desc',
            status: 'published',
            published: '2024-01-15T10:30:00Z',
            updated: '2024/01/16'
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      const posts = await getAllBlogPosts()
      
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/valid-dates.md')
      expect(posts).toHaveLength(1)
      expect(posts[0].frontmatter.published).toBe('2024-01-15T10:30:00Z')
      expect(posts[0].frontmatter.updated).toBe('2024/01/16')
    })
  })

  describe('Type Coercion', () => {
    it('coerces various field types correctly', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      const mockFiles = ['/project/vault/type-coercion.md']
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/type-coercion.md') {
          return {
            blog: 'true',
            title: 123,
            description: ['part1', 'part2'],
            status: 'published',
            published: '2024-01-15',
            tags: 'single-tag',
            category: 456
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      const posts = await getAllBlogPosts()
      
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/type-coercion.md')
      expect(posts[0].frontmatter.blog).toBe(true)
      expect(posts[0].frontmatter.title).toBe('123')
      expect(posts[0].frontmatter.description).toBe('part1,part2')
      expect(posts[0].frontmatter.tags).toEqual(['single-tag'])
      expect(posts[0].frontmatter.category).toBe('456')
    })

    it('handles array tags correctly', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      const mockFiles = ['/project/vault/array-tags.md']
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/array-tags.md') {
          return {
            blog: true,
            title: 'Array Tags',
            description: 'Test desc',
            status: 'published',
            published: '2024-01-15',
            tags: ['tag1', 'tag2', 'tag3']
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      const posts = await getAllBlogPosts()
      
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/array-tags.md')
      expect(posts[0].frontmatter.tags).toEqual(['tag1', 'tag2', 'tag3'])
    })
  })

  describe('Slug Generation', () => {
    it('uses custom slug from frontmatter', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      const mockFiles = ['/project/vault/custom-slug-post.md']
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/custom-slug-post.md') {
          return {
            blog: true,
            title: 'Custom Slug Post',
            description: 'Test desc',
            status: 'published',
            published: '2024-01-15',
            slug: 'my-custom-slug'
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      const posts = await getAllBlogPosts()
      const slugs = await getAllBlogSlugs()
      const foundPost = await findBlogPostBySlug('my-custom-slug')
      
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/custom-slug-post.md')
      expect(posts[0].slug).toBe('my-custom-slug')
      expect(slugs).toContain('my-custom-slug')
      expect(foundPost?.frontmatter.title).toBe('Custom Slug Post')
    })

    it('generates slug from filename when no custom slug', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      const mockFiles = ['/project/vault/My Cool Post!.md']
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/My Cool Post!.md') {
          return {
            blog: true,
            title: 'Generated Slug Post',
            description: 'Test desc',
            status: 'published',
            published: '2024-01-15'
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      const posts = await getAllBlogPosts()
      
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/My Cool Post!.md')
      expect(posts[0].slug).toBe('my-cool-post-')
      expect(posts[0].filePath).toBe('My Cool Post!.md')
    })

    it('detects duplicate custom slugs', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      const mockFiles = ['/project/vault/post1.md', '/project/vault/post2.md']
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/post1.md') {
          return {
            blog: true,
            title: 'Post 1',
            description: 'First post',
            status: 'published',
            published: '2024-01-15',
            slug: 'duplicate-slug'
          }
        }
        if (filePath === '/project/vault/post2.md') {
          return {
            blog: true,
            title: 'Post 2',
            description: 'Second post',
            status: 'published',
            published: '2024-01-15',
            slug: 'duplicate-slug'
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      await expect(getAllBlogPosts()).rejects.toThrow('Duplicate slug "duplicate-slug"')
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/post1.md')
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/post2.md')
    })

    it('detects duplicate generated slugs', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      const mockFiles = ['/project/vault/same-name.md', '/project/vault/nested/same-name.md']
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/same-name.md' || filePath === '/project/vault/nested/same-name.md') {
          return {
            blog: true,
            title: 'Same Name',
            description: 'Same filename',
            status: 'published',
            published: '2024-01-15'
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      await expect(getAllBlogPosts()).rejects.toThrow('Duplicate slug "same-name"')
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/same-name.md')
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/nested/same-name.md')
    })
  })

  describe('Error Handling', () => {
    it('propagates YAML parsing errors with file context', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      const mockFiles = ['/project/vault/malformed.md']
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/malformed.md') {
          throw new Error('Failed to parse YAML frontmatter in file: /project/vault/malformed.md\n\nError: bad yaml')
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      await expect(getAllBlogPosts()).rejects.toThrow('Failed to parse YAML frontmatter in file: /project/vault/malformed.md')
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/malformed.md')
    })

    it('includes file path in validation errors', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      const mockFiles = ['/project/vault/nested/deep/invalid.md']
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/nested/deep/invalid.md') {
          return {
            blog: true,
            title: 'Invalid',
            description: 'Test desc',
            status: 'published',
            published: 'not-a-date'
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      await expect(getAllBlogPosts()).rejects.toThrow('/project/vault/nested/deep/invalid.md')
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/nested/deep/invalid.md')
    })
  })

  describe('Sorting and File Processing', () => {
    it('sorts posts by published date and processes relative paths correctly', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      const mockFiles = [
        '/project/vault/newer.md',
        '/project/vault/nested/older.md'
      ]
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/newer.md') {
          return {
            blog: true,
            title: 'Alpha Post',  // Alphabetically first but chronologically second
            description: 'Newer post',
            status: 'published',
            published: '2024-01-20'
          }
        }
        if (filePath === '/project/vault/nested/older.md') {
          return {
            blog: true,
            title: 'Zebra Post',  // Alphabetically last but chronologically first
            description: 'Older post',
            status: 'published',
            published: '2024-01-10'
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      const posts = await getAllBlogPosts()
      
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/newer.md')
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/nested/older.md')
      expect(posts).toHaveLength(2)
      expect(posts[0].frontmatter.title).toBe('Zebra Post')  // Should be first chronologically
      expect(posts[1].frontmatter.title).toBe('Alpha Post')  // Should be second chronologically
      expect(posts[0].filePath).toBe('nested/older.md')
      expect(posts[1].filePath).toBe('newer.md')
    })

    it('calls walkDirectoryWithFilter with vault path and correct extensions', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue([])

      await getAllBlogPosts()

      expect(walkDirectoryWithFilter).toHaveBeenCalledTimes(1)
      expect(walkDirectoryWithFilter).toHaveBeenCalledWith(
        expect.stringMatching(/.*vault$/),
        ['md', 'mdx']
      )
    })
  })

  describe('Caching', () => {
    it('caches results between different function calls', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      const mockFiles = ['/project/vault/cached.md']
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/cached.md') {
          return {
            blog: true,
            title: 'Cached Post',
            description: 'Test desc',
            status: 'published',
            published: '2024-01-15'
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      // Multiple calls should use cached data
      await getAllBlogPosts()
      await getAllBlogSlugs()
      await findBlogPostBySlug('cached')

      // File system should only be accessed once
      expect(walkDirectoryWithFilter).toHaveBeenCalledTimes(1)
      expect(extractRawFrontmatter).toHaveBeenCalledTimes(1)
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/cached.md')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty file list correctly', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue([])

      const posts = await getAllBlogPosts()
      const slugs = await getAllBlogSlugs()
      const post = await findBlogPostBySlug('nonexistent')

      expect(walkDirectoryWithFilter).toHaveBeenCalledWith(
        expect.stringMatching(/.*vault$/),
        ['md', 'mdx']
      )
      expect(extractRawFrontmatter).not.toHaveBeenCalled()
      expect(posts).toHaveLength(0)
      expect(slugs).toHaveLength(0)
      expect(post).toBeUndefined()
    })

    it('processes mixed blog and non-blog files correctly', async () => {
      const { getAllBlogPosts, getAllBlogSlugs, findBlogPostBySlug, walkDirectoryWithFilter, extractRawFrontmatter } = await getVaultScanner()
      
      const mockFiles = [
        '/project/vault/blog-post.md',
        '/project/vault/private-note.md',
        '/project/vault/another-blog.md'
      ]
      vi.mocked(walkDirectoryWithFilter).mockResolvedValue(mockFiles)
      vi.mocked(extractRawFrontmatter).mockImplementation((filePath) => {
        if (filePath === '/project/vault/blog-post.md') {
          return {
            blog: true,
            title: 'Blog Post',
            description: 'A blog post',
            status: 'published',
            published: '2024-01-15'
          }
        }
        if (filePath === '/project/vault/private-note.md') {
          return {
            blog: false,
            title: 'Private Note',
            someField: 'irrelevant data',
            published: 'invalid-date'
          }
        }
        if (filePath === '/project/vault/another-blog.md') {
          return {
            blog: true,
            title: 'Another Blog',
            description: 'Another blog post',
            status: 'published',
            published: '2024-01-16'
          }
        }
        throw new Error(`Unexpected file path: ${filePath}`)
      })

      const posts = await getAllBlogPosts()

      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/blog-post.md')
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/private-note.md')
      expect(extractRawFrontmatter).toHaveBeenCalledWith('/project/vault/another-blog.md')
      expect(posts).toHaveLength(2)
      expect(posts.map(p => p.frontmatter.title)).toEqual(['Blog Post', 'Another Blog'])
    })
  })
})