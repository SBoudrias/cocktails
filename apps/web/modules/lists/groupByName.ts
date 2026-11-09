import { byNameListConfig, getNameFirstLetter } from '#/modules/lists/by-name';

/**
 * Items grouped by first letter, groups and items in list order. Items with
 * the same name are ordered by `href`, so the server (from the data) and the
 * client (from the search index) lay out the very same rows.
 */
export function groupByName<T extends { name: string; href: string }>(
  items: T[],
): { label: string; items: T[] }[] {
  const groups = Object.groupBy(items, getNameFirstLetter);

  return Object.keys(groups)
    .toSorted(byNameListConfig.sortHeaderBy)
    .map((label) => ({
      label,
      items: (groups[label] ?? []).toSorted(
        (a, b) =>
          byNameListConfig.sortItemBy(a, b) ||
          (a.href < b.href ? -1 : a.href > b.href ? 1 : 0),
      ),
    }));
}
