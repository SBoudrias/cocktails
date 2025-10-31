export default function groupByFirstLetter<T extends { name: string }>(
  entities: T[],
): [string, T[] | undefined][] {
  const articleRegExp = /^(the |an |a )?(\w+)/i;
  const groups = Object.entries(
    Object.groupBy(entities, (entity) => {
      const matches = entity.name.match(articleRegExp) ?? [];
      return matches[2]?.slice(0, 1).toUpperCase() ?? '#';
    }),
  )
    // Sort by first letter
    .toSorted(([a], [b]) => a.localeCompare(b))
    // Sort sub-lists by name
    .map(([letter, entities]): [string, T[] | undefined] => {
      return [
        letter,
        entities?.toSorted((a, b) => {
          const [, , aName = a.name] = a.name.match(articleRegExp) ?? [];
          const [, , bName = b.name] = b.name.match(articleRegExp) ?? [];
          return aName.localeCompare(bName);
        }),
      ];
    });

  return groups;
}
