import uFuzzy from '@leeoniya/ufuzzy';
import transliterate from '@sindresorhus/transliterate';

/**
 * Performs fuzzy search on a list of items using transliteration for accent-insensitive matching.
 *
 * @param items - The array of items to search through
 * @param haystack - Pre-computed searchable strings corresponding to each item
 * @param needle - The search term
 * @param limit - Maximum number of results to return (default: 1000)
 * @returns Filtered array of matching items
 */
export function fuzzySearch<T>(
  items: T[],
  haystack: string[],
  needle: string,
  limit = 1000,
): T[] {
  if (!needle || needle.trim().length === 0) return [];

  const uf = new uFuzzy();
  const [matchIndexes] = uf.search(haystack, transliterate(needle).toLowerCase());

  if (Array.isArray(matchIndexes) && matchIndexes.length > 0) {
    return matchIndexes
      .slice(0, limit)
      .map((index) => items[index])
      .filter((item) => item != null);
  }

  return [];
}

export { transliterate };
