import type { Recipe } from '@/types/Recipe';

/**
 * Parse chapter folder name: "01_The History of Tiki" → { order: 1, name: "The History of Tiki" }
 */
export function parseChapterFolder(folder: string): { order: number; name: string } | null {
  const match = folder.match(/^(\d+)_(.+)$/);
  if (!match || !match[1] || !match[2]) return null;
  return { order: parseInt(match[1], 10), name: match[2] };
}

/**
 * Check if folder name matches chapter pattern (##_Name)
 */
export function isChapterFolder(folder: string): boolean {
  return /^\d+_.+$/.test(folder);
}

/**
 * Group recipes by chapter, ordered by prefix number.
 * Recipes without chapter go to "Etc" at end.
 */
export function groupByChapter(recipes: Recipe[]): Array<[string, Recipe[]]> {
  const chapterMap = new Map<string, { order: number; name: string; recipes: Recipe[] }>();
  const noChapter: Recipe[] = [];

  for (const recipe of recipes) {
    if (!recipe.chapter) {
      noChapter.push(recipe);
      continue;
    }

    const parsed = parseChapterFolder(recipe.chapter);
    if (!parsed) {
      noChapter.push(recipe);
      continue;
    }

    const existing = chapterMap.get(recipe.chapter);
    if (existing) {
      existing.recipes.push(recipe);
    } else {
      chapterMap.set(recipe.chapter, {
        order: parsed.order,
        name: parsed.name,
        recipes: [recipe],
      });
    }
  }

  // Sort chapters by order, then sort recipes within each chapter alphabetically
  const sortedChapters = Array.from(chapterMap.values())
    .toSorted((a, b) => a.order - b.order)
    .map(
      (chapter) =>
        [chapter.name, chapter.recipes.toSorted((a, b) => a.name.localeCompare(b.name))] as [
          string,
          Recipe[],
        ],
    );

  // Add "Etc" group at end if there are recipes without chapters
  if (noChapter.length > 0) {
    sortedChapters.push(['Etc', noChapter.toSorted((a, b) => a.name.localeCompare(b.name))]);
  }

  return sortedChapters;
}
