# Obsidian Vault → GitHub Pages Blog Project

## Project Overview
This is a blog website that automatically syncs with an Obsidian.nvim vault and deploys to GitHub Pages. The user can write blog posts in their Obsidian vault using obsidian.nvim, and when they push changes to master, the blog automatically rebuilds with the latest content.

## Key Requirements & Goals
- **Primary Use Case**: Share learnings/insights on linguistics, physics, and primarily software engineering
- **Obsidian Integration**: Must work seamlessly with obsidian.nvim (not necessarily the Obsidian app)
- **Dual-Purpose Vault**: The Obsidian vault serves both personal notes AND blog content
- **Auto-Deploy**: Push to repository → automatic deployment to Vercel  
- **Non-Generic**: Custom design, not a generic blog template
- **Interactive Content**: Support for React components embedded in markdown (MDX)

## Architecture Decisions & Rationale

### Hosting Platform: Vercel (not GitHub Pages)
**Chosen**: Vercel for hosting and deployment
**Rejected**: GitHub Pages (static hosting only)
**Reasoning**: GitHub Pages only supports static files and cannot handle runtime file operations or dynamic imports needed for our vault processing approach. Vercel supports full Next.js features including runtime processing.

### Tech Stack Choice: Next.js + @next/mdx + Runtime Vault Processing
**Chosen**: Next.js with @next/mdx for full MDX capabilities + runtime vault scanning
**Rejected**: Nextra (too opinionated, less control over vault integration)
**Rejected**: next-mdx-remote (doesn't support export const variables in MDX)
**Rejected**: Pre-build file generation (more complex, file management overhead)
**Reasoning**: @next/mdx provides full MDX capabilities including variables, exports, and components. Runtime processing keeps the workflow simple while maintaining all MDX features.

### Content Format Decision: Direct .mdx When Needed
**Chosen**: Write .md for simple posts, .mdx when React components needed
**Rejected**: Custom syntax processing (jsx:component blocks)
**Reasoning**: 
- Keeps implementation simple
- Direct .mdx files work well with obsidian.nvim
- No custom processing pipeline needed
- Full MDX capabilities available when needed

### Vault Architecture: Git Submodule Approach
**Chosen**: Obsidian vault as separate Git submodule with @vault TypeScript alias
**Rejected**: Vault-in-repo (single repo containing both vault and blog code)
**Rejected**: Symlink approach (doesn't work with deployment)
**Reasoning**: 
- Keeps vault separate for personal use while enabling blog integration
- User wants vault for both personal notes AND blogging
- Submodules allow independent vault management while enabling blog deployment
- @vault alias provides clean import syntax for runtime processing

### Vault Structure for Dual Use
```
obsidian-vault/
├── 00-Inbox/              # Quick capture, unsorted  
├── 01-Personal/           # Private notes (ignored by blog)
├── 02-Knowledge/          # Could be public or private
├── 03-Blog/               # Designated blog content
│   ├── Published/         # Ready posts
│   ├── Drafts/           # Work in progress  
│   └── Ideas/            # Blog post ideas
├── 99-Meta/              # Vault management
├── attachments/          # All images/files
└── .obsidian/
```

### Content Publishing Strategy: Frontmatter-Based with Environment Filtering
**Method**: Use `blog: true` + `status` frontmatter fields with environment-based filtering
**Reasoning**: 
- `blog: true` flag clearly identifies blog content vs personal notes
- `status` field provides granular control (published, draft, idea)
- Environment filtering: production shows only published, development shows all
- Allows writing freely anywhere in vault while maintaining privacy

**Example frontmatter**:
```markdown
---
title: "My Blog Post"
blog: true              # Required flag for blog inclusion
status: "published"     # "published" | "draft" | "idea"
date: "2024-01-15"
updated: "2024-01-16"   # Optional last edit date
tags: [software-engineering, obsidian]
category: "tech"
excerpt: "Brief description..."
slug: "custom-slug"     # Optional custom slug (auto-generated from title if not provided)
---
```

## Project Structure
```
blog/
├── vault/                 # Git submodule → obsidian-vault repo
├── src/
│   ├── lib/
│   │   ├── vault-scanner.ts  # Scans vault for blog: true, handles slug mapping
│   │   ├── utils.ts          # Directory walking utilities
│   │   └── types/
│   │       └── content.ts    # TypeScript interfaces for frontmatter
│   ├── processors/           # Custom processing utilities (if needed)
│   ├── components/           # React components for blog
│   ├── app/
│   │   ├── blog/[slug]/     # Dynamic blog post pages
│   │   └── layout.tsx       # Root layout
│   └── styles/              # CSS/styling
├── public/                  # Static assets
├── next.config.ts          # Next.js + MDX configuration
├── tsconfig.json           # TypeScript config with @vault alias
└── package.json
```

## Obsidian.nvim Workflow
1. Use obsidian.nvim for all note-taking and blog writing
2. Create blog posts anywhere in vault structure (write .md or .mdx as needed)
3. Set `blog: true` and `status: "published"` in frontmatter when ready to publish
4. Push vault changes to vault repo
5. Push blog repo changes → triggers Vercel rebuild
6. Vercel scans vault at build time and deploys published content

## Technical Implementation Plan

### Runtime Content Processing Pipeline
1. **Build-Time Vault Scanning**: Use `walkDirectoryWithFilter()` to recursively scan vault for .md/.mdx files
2. **Frontmatter Processing**: Parse YAML frontmatter with gray-matter library
3. **Content Filtering**: 
   - Filter for `blog: true` posts only
   - Environment-based status filtering (published in prod, all in dev)
   - Skip files without required fields (title, etc.)
4. **Slug Generation & Duplicate Detection**: 
   - Generate URL slugs from titles or use custom slug from frontmatter
   - Fail build if duplicate slugs detected with detailed error message
5. **Runtime Import**: Use @vault alias to dynamically import .mdx files at request time
6. **Static Generation**: Use Next.js generateStaticParams for build-time route generation

### Key Features to Implement
- **Interactive Components**: Full MDX capabilities - embed React components directly in .mdx files
- **Content Discovery**: Tag-based filtering and categorization
- **Search**: Client-side search through blog content  
- **RSS Feed**: Auto-generated RSS feed for subscribers
- **Performance**: Optimized for Vercel hosting with runtime processing

## Current Status ✅ FULLY IMPLEMENTED AND TESTED

**Core System Complete**: All fundamental blog functionality implemented and thoroughly tested with 23 comprehensive test cases.

- ✅ **Blog System Architecture**: Next.js + @next/mdx + webpack-based processing (Turbopack removed for stability)
- ✅ **Vault Scanner**: Complete implementation with robust error handling and type validation
- ✅ **Content Processing Pipeline**: Full frontmatter validation, type coercion, and environment-based filtering
- ✅ **Dynamic MDX System**: Both .md and .mdx files supported with @vault alias resolution
- ✅ **Error Handling**: Comprehensive validation with detailed error messages and file context
- ✅ **Testing Suite**: 23 tests covering all critical functionality with minimal mocking approach

### Implementation Details Completed:
- **TypeScript Infrastructure**: PostFrontmatter interface, @vault alias, proper module resolution
- **Core Libraries**: 
  - Vault scanner with slug mapping and duplicate detection
  - Utils for file system operations (walkDirectoryWithFilter, extractRawFrontmatter)
  - Type coercion and validation for frontmatter fields
- **Blog Functionality**:
  - Dynamic route generation with generateStaticParams
  - Environment-based status filtering (dev shows all, prod shows published only)
  - Custom and auto-generated slug support with collision detection
  - Date validation that fails builds on invalid dates
- **MDX Processing**:
  - Full @next/mdx integration with remark/rehype plugins
  - remark-frontmatter, remark-gfm, remark-math, rehype-katex, remark-plantuml
  - Proper .md/.mdx extension handling with webpack configuration
- **Error Resilience**:
  - Non-blog files ignored gracefully (blog: false or missing flag)
  - Invalid frontmatter handled with detailed error context
  - Webpack rules to ignore non-markdown files during dynamic imports
- **Test Coverage**:
  - Blog filtering (true/false/coercion), status filtering, frontmatter validation
  - Type coercion, slug generation, error handling, file processing, caching
  - Edge cases: empty lists, mixed content, sorting, nested paths

### Recent Fixes Applied:
- ✅ Fixed sorting algorithm (was returning single value instead of comparison)
- ✅ Resolved Turbopack compatibility issues by switching to webpack
- ✅ Added comprehensive frontmatter type validation and coercion
- ✅ Implemented proper date validation that fails builds on invalid dates
- ✅ Enhanced error messages with file paths and context for debugging

## Wikilinks Implementation Plan (Option 2: Runtime Resolution)

### Overview
Implement runtime resolution of wikilinks to provide obsidian.nvim-like experience on the blog. This approach uses remark plugins to parse wikilinks and convert them to React components that resolve links at render time, solving the data access problem by separating parsing from resolution.

### The Data Access Solution
**Problem**: Remark plugins run during MDX compilation but wikilinks map is computed at build time by vault scanner.
**Solution**: Two-phase approach:
1. **Remark Plugin**: Parse `[[...]]` syntax → `<WikiLink>` components (no data access needed)
2. **React Component**: Resolve links at render time (has access to vault scanner data)

### Technical Implementation

#### 1. Obsidian-Style Path Resolution
```typescript
interface WikilinkResolver {
  filenameMap: Map<string, BlogPostDescription>     // "filename" -> post
  titleMap: Map<string, BlogPostDescription>        // "Page Title" -> post
  aliasMap: Map<string, BlogPostDescription>        // "alias" -> post  
  pathMap: Map<string, BlogPostDescription>         // "folder/file" -> post
}
```

**Resolution Priority** (matches Obsidian):
1. Exact filename match (case-insensitive): `[[My Post]]` → `My Post.md`
2. Title match from frontmatter: `[[Custom Title]]` → matches `title: "Custom Title"`
3. Path-based match: `[[folder/subfolder/file]]` → matches file location
4. Alias match: `[[alias]]` → matches `aliases: [alias]` in frontmatter

#### 2. Remark Plugin Implementation
```javascript
function remarkObsidianWikilinks() {
  return (tree, file) => {
    visit(tree, 'text', (node) => {
      // Parse: [[target|display]] or [[target#heading|display]]
      // Convert to: <WikiLink target="target" display="display" heading="heading" />
      // No data access - purely syntactic transformation
    })
  }
}
```

#### 3. WikiLink React Component
```typescript
function WikiLink({ target, display, heading }: WikiLinkProps) {
  const wikilinkMap = useWikilinkMap() // Access to vault scanner data
  const resolved = resolveWikilink(target, wikilinkMap)
  
  if (resolved.type === 'blog-post') {
    const href = heading ? `/blog/${resolved.slug}#${heading}` : `/blog/${resolved.slug}`
    return <Link href={href}>{display || target}</Link>
  }
  if (resolved.type === 'private-note') {
    return <span className="private-link" title="Private content">{display || target} 🔒</span>
  }
  return <span className="broken-link" title="Link not found">{display || target} ❌</span>
}
```

#### 4. Wikilink Resolution Logic
**Link Parsing**: Support all Obsidian formats:
- `[[Simple Link]]` → target: "Simple Link"
- `[[Link|Display Text]]` → target: "Link", display: "Display Text"  
- `[[file#heading]]` → target: "file", heading: "heading"
- `[[folder/subfolder/file]]` → target: "folder/subfolder/file"

**Content Classification**:
- **Blog posts** (`blog: true` + published): Render as proper Next.js links
- **Private notes** (`blog: false` or unpublished): Show privacy indicator 🔒
- **Missing files**: Show broken link indicator ❌

#### 5. Vault Scanner Integration
Extend existing vault scanner to build wikilink resolution maps:
```typescript
// In vault-scanner.ts
export async function buildWikilinkResolver(): Promise<WikilinkResolver> {
  // Scan ALL files (not just blog posts) for comprehensive link resolution
  // Build filename, title, alias, and path maps
  // Include both blog posts and private notes for link detection
}
```

### Implementation Steps

1. **Extend Vault Scanner** (`src/lib/vault-scanner.ts`):
   - Add `buildWikilinkResolver()` function
   - Scan all vault files (not just blog posts) for comprehensive mapping
   - Build all four resolution maps (filename, title, alias, path)

2. **Create Remark Plugin** (`src/lib/remark-obsidian-wikilinks.ts`):
   - Parse `[[target|display]]` and `[[target#heading]]` syntax
   - Convert to `<WikiLink>` JSX components
   - Handle edge cases: escaped brackets, nested brackets

3. **WikiLink Component** (`src/components/WikiLink.tsx`):
   - Runtime resolution using wikilink resolver
   - Different styling for blog posts, private notes, broken links
   - Support for heading anchors

4. **Add to MDX Config** (next.config.ts):
   ```javascript
   remarkPlugins: [
     remarkFrontmatter, 
     remarkObsidianWikilinks,  // New plugin
     remarkGfm, 
     remarkMath, 
     remarkPlantuml
   ]
   ```

5. **Styling** (`src/styles/`):
   - Blog link: Standard link styling
   - Private link: Muted with lock icon
   - Broken link: Red with broken link icon

### Obsidian Feature Support
- ✅ **Case-insensitive matching**: `[[blog post]]` matches `[[Blog Post]]`
- ✅ **Unique filename resolution**: `[[filename]]` works regardless of folder location
- ✅ **Path-based links**: `[[folder/subfolder/file]]` for explicit paths
- ✅ **Display text**: `[[target|Custom Display]]` syntax
- ✅ **Heading links**: `[[post#section]]` for anchor links
- ✅ **Alias support**: Resolve links to `aliases: [alias1, alias2]` frontmatter

### Benefits of This Approach
- **Perfect Obsidian Compatibility**: Exact same link behavior as obsidian.nvim
- **Privacy Aware**: Automatic handling of private/unpublished content with indicators
- **Runtime Resolution**: Works with our existing vault scanning architecture
- **No Build Complexity**: Clean separation between parsing and resolution
- **SEO Friendly**: Published blog links become proper HTML links
- **Performance**: Can be cached and optimized at component level

### Technical Advantages
- **Data Access Solved**: React components have full access to vault data
- **Clean Architecture**: Remark handles syntax, React handles business logic
- **Extensible**: Easy to add new link types or resolution rules
- **Maintainable**: Separate concerns make debugging and updates easier

## ✅ APPROVED DESIGN SYSTEM: Cassidy-Inspired Personal Blog

### Design Philosophy
**"Approachable Expertise"** - Professional technical content presented with warmth, personality, and playful interactive elements, while maintaining excellent readability and content focus.

### Design System Specifications

#### Color Palette
```css
/* Primary Colors */
--bg-light: #fefefe
--bg-dark: #0f0f0f
--text-light: #2a2a2a
--text-dark: #e8e8e8

/* Cassidy-Inspired Dynamic Accent System */
--accent-colors: [
  "#24d05a", /* Green */
  "#eb4888", /* Pink */
  "#10a2f5", /* Blue */
  "#e9bc3f", /* Yellow */
  "#9d4edd", /* Purple */
  "#f72585"  /* Magenta */
]

/* Neutral Grays */
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-700: #374151
--gray-800: #1f2937
```

#### Typography System
```css
/* Primary Font Stack */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Hierarchy */
--text-4xl: 2.25rem   /* Hero titles */
--text-3xl: 1.875rem  /* Page titles */
--text-2xl: 1.5rem    /* Blog post titles */
--text-xl: 1.25rem    /* Section headers */
--text-lg: 1.125rem   /* Subtitles */
--text-base: 1rem     /* Body text */
--text-sm: 0.875rem   /* Metadata */

/* Code Typography */
font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
```

#### Interactive Elements
- **Dynamic Color System**: Random accent colors applied to links, tags, and interactive elements
- **Hover Effects**: Subtle scale transforms and color transitions
- **Smooth Transitions**: 200ms ease-in-out for all interactive states

### Layout Structure

#### Homepage Design
```jsx
<main className="max-w-2xl mx-auto px-6 py-12">
  {/* Hero Section */}
  <section className="text-center mb-16">
    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-1 to-accent-2 mx-auto mb-6" />
    <h1 className="text-4xl font-bold mb-4">Your Name</h1>
    <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
      I write about software engineering, linguistics, and physics
    </p>
    <div className="flex justify-center gap-4 text-sm">
      <a href="/blog" className="hover-accent">Blog</a>
      <a href="/about" className="hover-accent">About</a>
      <a href="/tags" className="hover-accent">Tags</a>
    </div>
  </section>

  {/* Recent Posts */}
  <section>
    <h2 className="text-2xl font-bold mb-8">Recent Posts</h2>
    {/* Post list with dynamic accent colors */}
  </section>
</main>
```

#### Blog Post List (Cassidy-Style)
```jsx
<div className="space-y-6">
  {posts.map(post => (
    <article key={post.slug} className="group">
      <Link href={`/blog/${post.slug}`} className="block hover-lift">
        <h3 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors">
          {post.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-3">
          {post.description}
        </p>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <time>{formatDate(post.published)}</time>
          {post.tags && (
            <div className="flex gap-2">
              {post.tags.map(tag => (
                <span key={tag} className="tag-accent">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  ))}
</div>
```

#### Tag Filtering System
```jsx
<section className="mb-12">
  <h2 className="text-2xl font-bold mb-6">Browse by Topic</h2>
  <div className="flex flex-wrap gap-3">
    <button className="tag-filter active" data-tag="all">All Posts</button>
    <button className="tag-filter" data-tag="software-engineering">#software-engineering</button>
    <button className="tag-filter" data-tag="linguistics">#linguistics</button>
    <button className="tag-filter" data-tag="physics">#physics</button>
  </div>
</section>
```

### Key Features Implementation

#### Dynamic Accent Color System
```javascript
// Random color assignment like Cassidy's site
const accentColors = ["#24d05a", "#eb4888", "#10a2f5", "#e9bc3f", "#9d4edd", "#f72585"];
const getRandomAccent = () => accentColors[Math.floor(Math.random() * accentColors.length)];

// Apply to interactive elements
useEffect(() => {
  document.querySelectorAll('.hover-accent').forEach(el => {
    el.style.setProperty('--accent-color', getRandomAccent());
  });
}, []);
```

#### Tag-Based Content Discovery
- **Visual Tag System**: Colored tags with consistent styling
- **Filter Functionality**: Client-side filtering by tag
- **Tag Cloud**: Popular tags with dynamic sizing
- **Tag Pages**: Dedicated pages for each tag

#### Interactive Reading Experience
- **Smooth Transitions**: Hover effects on post previews
- **Color-Coded Elements**: Links, blockquotes, code blocks get random accent colors
- **Progressive Enhancement**: Works without JavaScript

### Blog Post Layout

#### Individual Post Design
```jsx
<article className="max-w-3xl mx-auto px-6 py-12">
  {/* Post Header */}
  <header className="mb-12 text-center">
    <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
    <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">{post.description}</p>
    <div className="flex justify-center items-center gap-6 text-sm text-gray-500">
      <time>{formatDate(post.published)}</time>
      {post.updated && <span>Updated {formatDate(post.updated)}</span>}
      <div className="flex gap-2">
        {post.tags?.map(tag => (
          <Link key={tag} href={`/tags/${tag}`} className="tag-accent">#{tag}</Link>
        ))}
      </div>
    </div>
  </header>

  {/* Post Content */}
  <div className="prose prose-lg dark:prose-invert max-w-none">
    {/* MDX content with custom components */}
  </div>
</article>
```

### Technical Implementation

#### CSS Custom Properties
```css
.hover-accent {
  --accent-color: #10a2f5;
  transition: color 200ms ease-in-out;
}

.hover-accent:hover {
  color: var(--accent-color);
}

.tag-accent {
  color: var(--accent-color);
  transition: all 200ms ease-in-out;
}

.tag-accent:hover {
  background: var(--accent-color);
  color: white;
}

.hover-lift:hover {
  transform: translateY(-2px);
  transition: transform 200ms ease-in-out;
}
```

#### Components to Build
1. **TagFilter** - Interactive tag filtering
2. **PostPreview** - Blog post card with hover effects
3. **RandomAccentProvider** - Dynamic color assignment
4. **TagCloud** - Visual tag discovery
5. **ThemeToggle** - Dark/light mode switcher

### Personality Touches

#### Cassidy-Inspired Elements
- **Playful Bio**: "I like to make ideas, code, and explanations that actually make sense"
- **Random Post Button**: "Surprise me!" feature
- **Dynamic Colors**: Links and accents change colors on page load
- **Easter Eggs**: Subtle interactions and hover surprises
- **Approachable Tone**: Professional but not corporate

#### Content Discovery
- **Tag-based navigation** (primary feature you loved)
- **Recent posts** with engaging previews
- **Search functionality** for content discovery
- **RSS feed** for subscribers

### Performance & Accessibility
- **Semantic HTML**: Proper heading hierarchy, ARIA labels
- **Color Contrast**: WCAG AA compliance for all color combinations
- **Responsive Design**: Mobile-first approach
- **Fast Loading**: Optimized images, minimal JavaScript
- **Keyboard Navigation**: Full keyboard accessibility

## Next Steps
1. **Deploy to Vercel**: 
   - Connect GitHub repository to Vercel
   - No custom GitHub Actions needed - Vercel auto-detects Next.js
   - Test production deployment with current vault structure
2. **UI/UX Implementation** (READY TO START):
   - Implement approved Cassidy-inspired design system
   - Build component library with dynamic accent colors
   - Add tag-based filtering and content discovery
3. **Advanced Features**:
   - Wikilinks processing for internal note references (detailed plan above)
   - Search functionality and RSS feed generation
   - Image optimization and asset handling
4. **Production Optimization**:
   - Convert vault/ to git submodule for independent vault management
   - Add performance monitoring and analytics

## Implementation Notes
- User implementing with guidance rather than automated coding
- Focus on runtime processing with full MDX capabilities
- Maintain excellent obsidian.nvim experience throughout
- Build fails on duplicate slugs with detailed error messages

## Development Commands
```bash
npm run dev        # Start development server
npm run build      # Build for production  
npm run start      # Start production server
npm run lint       # Run ESLint
npm test           # Run comprehensive test suite (23 tests)
npm run test:ui    # Run tests with interactive UI
```

## Error Handling Philosophy
**Fail Fast with Detailed Context**: Build should fail immediately on invalid content but provide comprehensive debugging information for quick fixes. Always include file paths, error context, and actionable guidance.

## Important Notes
- Must handle Obsidian wikilinks: `[[Internal Link]]` → proper blog links
- Respect `publish: true` flag - never accidentally publish private notes
- Maintain vault portability - processing should not modify original vault files
- GitHub Pages deployment requires static export configuration
- Submodule updates need to be handled in CI/CD pipeline