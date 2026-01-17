const articleRegExp = /^(the |an |a )?(.+)/i;

/**
 * Extracts the first letter of a name, skipping leading articles (the, an, a).
 * Used for alphabetical grouping in lists.
 */
export function getNameFirstLetter<T extends { name: string }>(item: T): string {
  const matches = item.name.match(articleRegExp) ?? [];
  return matches[2]?.slice(0, 1).toUpperCase() ?? '#';
}

/**
 * Returns the name with leading articles (the, an, a) stripped for sorting purposes.
 */
export function getNameForSorting<T extends { name: string }>(item: T): string {
  const [, , strippedName = item.name] = item.name.match(articleRegExp) ?? [];
  return strippedName;
}

export function compareByName<T extends { name: string }>(a: T, b: T) {
  return getNameForSorting(a).localeCompare(getNameForSorting(b));
}

export const byNameListConfig = {
  groupBy: getNameFirstLetter,
  sortItemBy: compareByName,
  sortHeaderBy: (a: string, b: string) => a.localeCompare(b),
};
