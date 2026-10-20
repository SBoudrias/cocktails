import fs from 'node:fs/promises';
import path from 'node:path';
import { logger } from './cli-util.ts';
import { PACKAGE_ROOT } from './paths.ts';
import type { Report } from './report.ts';

function isChapterFolder(folder: string): boolean {
  return /^\d+_.+$/.test(folder);
}

/**
 * Validates book chapter structure: chapter folders must match the `##_Name`
 * pattern, chapters must not be empty, recipe slugs must be unique within a
 * book, and a book is either all chapters or all flat recipes — never both.
 */
export async function reportBookChapters(report: Report): Promise<void> {
  logger.header('📚 Validating book chapter structure...');
  const bookRoot = path.join(PACKAGE_ROOT, 'data/recipes/book');
  for await (const bookSlug of await fs.readdir(bookRoot)) {
    const bookPath = path.join(bookRoot, bookSlug);
    const entries = await fs.readdir(bookPath);

    const flatRecipes: string[] = [];
    const chapterDirs: string[] = [];
    const recipeSlugs = new Map<string, string>(); // slug -> location for duplicate detection

    for (const entry of entries) {
      if (entry === '_source.json') continue;

      const entryPath = path.join(bookPath, entry);
      const stat = await fs.stat(entryPath);

      if (stat.isDirectory()) {
        // Validate chapter folder naming pattern
        if (!isChapterFolder(entry)) {
          report.fail(
            `Book "${bookSlug}": Directory "${entry}" does not match chapter pattern (##_Name)`,
          );
          continue;
        }

        chapterDirs.push(entry);

        // Check for recipes in chapter
        const chapterEntries = await fs.readdir(entryPath);
        const chapterRecipes = chapterEntries.filter((f) => f.endsWith('.json'));

        if (chapterRecipes.length === 0) {
          report.fail(`Book "${bookSlug}": Chapter "${entry}" is empty`);
        }

        // Check for duplicate recipe slugs
        for (const recipeFile of chapterRecipes) {
          const recipeSlug = path.basename(recipeFile, '.json');
          const existingLocation = recipeSlugs.get(recipeSlug);
          if (existingLocation) {
            report.fail(
              `Book "${bookSlug}": Duplicate recipe "${recipeSlug}" ` +
                `found in "${entry}" and "${existingLocation}"`,
            );
          } else {
            recipeSlugs.set(recipeSlug, entry);
          }
        }
      } else if (entry.endsWith('.json')) {
        flatRecipes.push(entry);

        // Check for duplicate recipe slugs
        const recipeSlug = path.basename(entry, '.json');
        const existingLocation = recipeSlugs.get(recipeSlug);
        if (existingLocation) {
          report.fail(
            `Book "${bookSlug}": Duplicate recipe "${recipeSlug}" ` +
              `found in root and "${existingLocation}"`,
          );
        } else {
          recipeSlugs.set(recipeSlug, 'root');
        }
      }
    }

    // All-or-nothing: if chapters exist, all recipes must be in chapters
    if (chapterDirs.length > 0 && flatRecipes.length > 0) {
      report.fail(
        `Book "${bookSlug}": Has chapter directories but also has flat recipe files. ` +
          `Move all recipes into chapter directories: ${flatRecipes.join(', ')}`,
      );
    }
  }
  logger.footer('Done!');
}
