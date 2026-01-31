import { useMemo } from 'react';

/**
 * React hook that creates a memoized function to check if a recipe name is unique.
 * Builds a name->count lookup map once and returns a function that checks uniqueness
 * without repeated array traversal.
 *
 * @param recipes - Array of recipes to check uniqueness against
 * @returns Function that returns true if the recipe name appears only once in the list
 */
export default function useNameIsUnique<T extends { name: string }>(
  recipes: T[],
): (recipe: T) => boolean {
  const nameCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const recipe of recipes) {
      const normalizedName = recipe.name.toLowerCase();
      map.set(normalizedName, (map.get(normalizedName) ?? 0) + 1);
    }
    return map;
  }, [recipes]);

  return useMemo(
    () => (recipe: T) => (nameCountMap.get(recipe.name.toLowerCase()) ?? 0) <= 1,
    [nameCountMap],
  );
}
