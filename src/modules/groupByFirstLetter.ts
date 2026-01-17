import { getNameFirstLetter } from './getNameFirstLetter';

const articleRegExp = /^(the |an |a )?(\w+)/i;

/** Strips leading articles (the/an/a) for sorting purposes */
function getNameForSorting(name: string): string {
  const [, , strippedName = name] = name.match(articleRegExp) ?? [];
  return strippedName;
}

export default function groupByFirstLetter<T extends { name: string }>(
  entities: T[],
): [string, T[] | undefined][] {
  const groups = Object.entries(Object.groupBy(entities, getNameFirstLetter))
    // Sort by first letter
    .sort(([a], [b]) => a.localeCompare(b))
    // Sort sub-lists by name (stripping articles for comparison)
    .map(([letter, entities]): [string, T[] | undefined] => {
      return [
        letter,
        entities?.sort((a, b) =>
          getNameForSorting(a.name).localeCompare(getNameForSorting(b.name)),
        ),
      ];
    });

  return groups;
}
