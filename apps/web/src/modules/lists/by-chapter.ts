import { parseChapterFolder, type Recipe } from '@cocktails/data';

/**
 * Get the chapter display name for a recipe.
 * Returns 'Etc' for recipes without a valid chapter.
 */
export function getChapterName(recipe: Recipe): string {
  if (!recipe.chapter) return 'Etc';
  const parsed = parseChapterFolder(recipe.chapter);
  return parsed?.name ?? 'Etc';
}

/**
 * Get the page number from a recipe's book ref.
 * Returns Infinity if no page number is found (sorts to end).
 */
function getPageNumber(recipe: Recipe): number {
  const bookRef = recipe.refs.find((ref) => ref.type === 'book');
  if (bookRef && 'page' in bookRef) {
    return bookRef.page;
  }
  return Infinity;
}

/**
 * Compare recipes by their page number within a chapter.
 */
export function compareByPage(a: Recipe, b: Recipe): number {
  return getPageNumber(a) - getPageNumber(b);
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
 * Create a chapter-aware header comparator that uses recipe data
 * to determine chapter order.
 */
export function createChapterHeaderComparator(
  recipes: Recipe[],
): (a: string, b: string) => number {
  // Build a map of chapter display name -> order
  const chapterOrderMap = new Map<string, number>();
  for (const recipe of recipes) {
    if (recipe.chapter) {
      const parsed = parseChapterFolder(recipe.chapter);
      if (parsed) {
        chapterOrderMap.set(parsed.name, parsed.order);
      }
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

export const byChapterListConfig = {
  groupBy: getChapterName,
  sortItemBy: compareByPage,
  sortHeaderBy: compareChapterHeaders,
};

/**
 * Create a list config with proper chapter ordering based on recipe data.
 */
export function createByChapterListConfig(recipes: Recipe[]) {
  return {
    groupBy: getChapterName,
    sortItemBy: compareByPage,
    sortHeaderBy: createChapterHeaderComparator(recipes),
  };
}
