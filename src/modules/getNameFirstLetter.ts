/**
 * Extracts the first letter of a name, skipping leading articles (the, an, a).
 * Used for alphabetical grouping in lists.
 */
export function getNameFirstLetter(name: string): string {
  const articleRegExp = /^(the |an |a )?(\w+)/i;
  const matches = name.match(articleRegExp) ?? [];
  return matches[2]?.slice(0, 1).toUpperCase() ?? '#';
}
