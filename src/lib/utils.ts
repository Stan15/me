import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import matter from "gray-matter";

export async function walkDirectoryWithFilter(dirPath: string, extensions: string[] | null = null) {
  const files: string[] = []
  extensions &&= extensions.map(ext => ext.replace(/^\./, ''))

  async function walk(currentPath: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else {
        const extension = path.extname(entry.name).replace(/^\./, '')
        if (extensions == null || extensions.includes(extension)) {
          files.push(fullPath)
        }
      }
    }
  }

  await walk(dirPath)
  return files
}

export function extractRawFrontmatter(markdownFilePath: string): Record<string, unknown> {
  const markdownContent = fsSync.readFileSync(markdownFilePath, 'utf8')

  try {
    return matter(markdownContent).data;
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

export function createSlugNameFromFilePath(filePath: string) {
  const filename = path.basename(filePath, path.extname(filePath));
  return filename.replace(/[^A-Za-z0-9]+/gi, '-').toLowerCase();
}

