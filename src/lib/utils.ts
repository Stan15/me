import fs from 'fs/promises';
import path from 'path';

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

