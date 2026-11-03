import type { RecipeCardItem } from '#/modules/recipeCard';

/**
 * Get the chapter display name for a recipe card.
 * Returns 'Etc' for recipes without a valid chapter.
 */
export function getChapterName(item: RecipeCardItem): string {
  return item.chapter?.name ?? 'Etc';
}

/**
 * Compare recipe cards by their page number within a chapter.
 * Cards without a page number sort to the end.
 */
export function compareByPage(a: RecipeCardItem, b: RecipeCardItem): number {
  return (a.page ?? Infinity) - (b.page ?? Infinity);
}

/**
 * Compare chapter headers by their order prefix number.
 * 'Etc' always sorts to the end.
 */
export function compareChapterHeaders(a: string, b: string): number {
  if (a === 'Etc') return 1;
  if (b === 'Etc') return -1;
  // Headers are display names, we need to find recipes to get order
  // Since we don't have recipes here, sort alphabetically as fallback
  return a.localeCompare(b);
}

/**
 * Create a chapter-aware header comparator that uses recipe card data
 * to determine chapter order.
 */
export function createChapterHeaderComparator(
  items: RecipeCardItem[],
): (a: string, b: string) => number {
  // Build a map of chapter display name -> order
  const chapterOrderMap = new Map<string, number>();
  for (const item of items) {
    if (item.chapter) {
      chapterOrderMap.set(item.chapter.name, item.chapter.order);
    }
  }

  return (a: string, b: string): number => {
    if (a === 'Etc') return 1;
    if (b === 'Etc') return -1;
    const orderA = chapterOrderMap.get(a) ?? Infinity;
    const orderB = chapterOrderMap.get(b) ?? Infinity;
    return orderA - orderB;
  };
}

/**
 * Create a list config with proper chapter ordering based on recipe card data.
 */
export function createByChapterListConfig(items: RecipeCardItem[]) {
  return {
    groupBy: getChapterName,
    sortItemBy: compareByPage,
    sortHeaderBy: createChapterHeaderComparator(items),
  };
}
