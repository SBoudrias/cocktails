const articleRegExp = /^(the |an |a )?(\w+)/i;

/**
 * Extracts the first letter of a name, skipping leading articles (the, an, a).
 * Used for alphabetical grouping in lists.
 */
export function getNameFirstLetter(item: { name: string }): string {
  const matches = item.name.match(articleRegExp) ?? [];
  return matches[2]?.slice(0, 1).toUpperCase() ?? '#';
}

/**
 * Returns the name with leading articles (the, an, a) stripped for sorting purposes.
 */
export function getNameForSorting(item: { name: string }): string {
  const [, , strippedName = item.name] = item.name.match(articleRegExp) ?? [];
  return strippedName;
}
