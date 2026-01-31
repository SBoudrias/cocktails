import type { Attribution, Recipe } from '@cocktails/data';
import { match } from 'ts-pattern';

const ATTRIBUTION_PRIORITY: Attribution['relation'][] = [
  'adapted by',
  'recipe author',
  'book',
  'bar',
];

type ExcludeOptions = {
  [K in Attribution['relation']]?: string;
} & {
  /** Exclude this source name from the fallback */
  source?: string;
};

function formatAttribution(
  attr: Attribution,
  bookName: string | undefined,
  exclude?: ExcludeOptions,
): string | undefined {
  return match(attr)
    .with({ relation: 'adapted by' }, ({ source }) => {
      const isExcluded = exclude?.['adapted by']?.toLowerCase() === source.toLowerCase();
      return isExcluded ? bookName : [source, bookName].filter(Boolean).join(' | ');
    })
    .with({ relation: 'recipe author' }, ({ source }) => {
      const isExcluded =
        exclude?.['recipe author']?.toLowerCase() === source.toLowerCase();
      return isExcluded ? bookName : [source, bookName].filter(Boolean).join(' | ');
    })
    .with({ relation: 'bar' }, ({ source }) => {
      const isExcluded = exclude?.bar?.toLowerCase() === source.toLowerCase();
      if (isExcluded) return bookName;
      return bookName ?? `served at ${source}`;
    })
    .with({ relation: 'book' }, ({ source }) => {
      const isExcluded = exclude?.book?.toLowerCase() === source.toLowerCase();
      return isExcluded ? undefined : source;
    })
    .exhaustive();
}

/**
 * Returns the attribution string for a recipe based on priority.
 * Use this when you need custom secondary content but want to fall back
 * to the default attribution behavior for some recipes.
 *
 * @param recipe - The recipe to get attribution for
 * @param options - Optional options object
 * @param options.exclude - Exclusion options to filter out specific attributions
 */
export function getRecipeAttribution(
  recipe: Recipe,
  options?: { exclude?: ExcludeOptions },
): string | undefined {
  const exclude = options?.exclude;
  const sortedAttributions = recipe.attributions
    .filter((attr) => ATTRIBUTION_PRIORITY.includes(attr.relation))
    .toSorted(
      (a, b) =>
        ATTRIBUTION_PRIORITY.indexOf(a.relation) -
        ATTRIBUTION_PRIORITY.indexOf(b.relation),
    );

  const bookName = recipe.source.type === 'book' ? recipe.source.name : undefined;

  for (const attr of sortedAttributions) {
    const result = formatAttribution(attr, bookName, exclude);
    if (result) return result;
  }

  // Fallback to source name if not excluded
  if (exclude?.source?.toLowerCase() !== recipe.source.name.toLowerCase()) {
    return recipe.source.name;
  }

  return undefined;
}
