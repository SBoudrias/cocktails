import { byNameListConfig, getNameFirstLetter } from '#/modules/lists/by-name';

/**
 * A letter's URL segment: the lowercase letter, or `0-9` for names starting
 * with a digit (grouped under `#`, which can't sit in a path segment).
 */
function toLetterSlug(letter: string): string {
  return letter === '#' ? '0-9' : letter.toLowerCase();
}

/**
 * The URL segment of the letter page an item is listed on.
 */
export function getLetterSlug(item: { name: string }): string {
  return toLetterSlug(getNameFirstLetter(item));
}

/**
 * The letter pages of a list: one per first letter, in the list's header
 * order, with how many items each holds.
 */
export function getLetters(
  items: { name: string }[],
): { slug: string; label: string; count: number }[] {
  const groups = Object.groupBy(items, getNameFirstLetter);

  return Object.keys(groups)
    .toSorted(byNameListConfig.sortHeaderBy)
    .map((label) => ({
      slug: toLetterSlug(label),
      label,
      count: groups[label]?.length ?? 0,
    }));
}
