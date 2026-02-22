const articleRegExp = /^(the |an |a )?(.+)/i;

/**
 * Extracts the first letter of a name, skipping leading articles (the, an, a).
 * Used for alphabetical grouping in lists.
 * Names starting with numbers are grouped under '#'.
 */
export function getNameFirstLetter<T extends { name: string }>(item: T): string {
  const matches = item.name.match(articleRegExp) ?? [];
  const firstChar = matches[2]?.slice(0, 1).toUpperCase() ?? '#';
  // Group all numbers under '#'
  return /\d/.test(firstChar) ? '#' : firstChar;
}

/**
 * Returns the name with leading articles (the, an, a) stripped for sorting purposes.
 */
export function getNameForSorting<T extends { name: string }>(item: T): string {
  const [, , strippedName = item.name] = item.name.match(articleRegExp) ?? [];
  return strippedName;
}

function compareByName<T extends { name: string }>(a: T, b: T) {
  return getNameForSorting(a).localeCompare(getNameForSorting(b));
}

export const byNameListConfig = {
  groupBy: getNameFirstLetter,
  sortItemBy: compareByName,
  sortHeaderBy: (a: string, b: string) => {
    // '#' always comes first
    if (a === '#') return -1;
    if (b === '#') return 1;
    return a.localeCompare(b);
  },
};
