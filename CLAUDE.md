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

## Current Status
- Project initialized with Next.js + TypeScript + Tailwind
- Switched to Vercel hosting for runtime processing capabilities
- Architecture finalized: @next/mdx + runtime vault scanning + git submodule
- **Completed**: 
  - TypeScript types for frontmatter (PostFrontmatter interface) with comprehensive fields
  - Vault scanner implementation (vault-scanner.ts) with:
    - Slug mapping and duplicate detection with detailed error messages
    - Environment-based filtering (published in prod, all in dev)
    - Blog post filtering (`blog: true` required)
    - Export functions: getAllBlogSlugs, findBlogPostBySlug, getAllBlogPosts
  - Directory walking utility (utils.ts) for recursive file scanning with extension filtering
  - Blog post page (blog/[slug]/page.tsx) with generateStaticParams and metadata generation
  - Comprehensive test vault structure with edge cases:
    - Valid posts (published, draft, nested, hidden)
    - Invalid posts (missing fields, wrong types, malformed YAML)
    - Non-blog content (private notes, files without blog flag)
  - @vault TypeScript alias configuration
  - Next.js dependencies properly installed and configured
  - Development server running successfully

## Next Steps
1. **Test and debug current implementation**:
   - Test vault scanner with all test files
   - Debug any runtime issues with @vault imports
   - Verify generateStaticParams produces correct routes
2. **Build blog UI components and layouts**:
   - Create blog post listing page
   - Design blog layout and styling
   - Add navigation and metadata display
3. **Set up Vercel deployment**
4. **Convert vault/ to actual git submodule**

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
npm run typecheck  # Run TypeScript checks (when available)
```

## Error Handling Philosophy
**Fail Fast with Detailed Context**: Build should fail immediately on invalid content but provide comprehensive debugging information for quick fixes. Always include file paths, error context, and actionable guidance.

## Important Notes
- Must handle Obsidian wikilinks: `[[Internal Link]]` → proper blog links
- Respect `publish: true` flag - never accidentally publish private notes
- Maintain vault portability - processing should not modify original vault files
- GitHub Pages deployment requires static export configuration
- Submodule updates need to be handled in CI/CD pipeline