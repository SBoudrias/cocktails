export default function groupByFirstLetter<T extends { name: string }>(
  entities: T[],
): [string, T[] | undefined][] {
  const firstLetterRegExp = /^(the |a )?([a-z])/i;
  const ingredientGroups = Object.entries(
    Object.groupBy(entities, (entity) => {
      const matches = entity.name.match(firstLetterRegExp) ?? [];
      return matches[2]?.toUpperCase() ?? '#';
    }),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    // Sort sub-lists
    .map(([letter, ingredients]): [string, T[] | undefined] => {
      return [letter, ingredients?.sort((a, b) => a.name.localeCompare(b.name))];
    });

  return ingredientGroups;
}
