import type { IngredientType, RootIngredient } from '@cocktails/data';
import { ingredientHasData } from '#/modules/hasData';
import { getIngredientUrl } from '#/modules/url';

/**
 * A bottle as a detail page's data file stores it, keyed by its slug in the
 * file's `bottles` table: its name, its type (for its URL), whether it has
 * a page worth linking, and how many recipes use it. Substitution and
 * member lists name the same bottles across many pages, so each is stored
 * once.
 */
export type StoredBottle = [
  name: string,
  type: IngredientType,
  hasPage: boolean,
  count: number,
];

/** A bottle as its list row shows it. */
export type BottleRow = {
  name: string;
  slug: string;
  href: ReturnType<typeof getIngredientUrl> | undefined;
  count: number;
};

export function toStoredBottle(
  ingredient: RootIngredient,
  recipeCounts: Map<string, number>,
): StoredBottle {
  return [
    ingredient.name,
    ingredient.type,
    Boolean(ingredientHasData(ingredient)),
    recipeCounts.get(ingredient.slug) ?? 0,
  ];
}

/** Resolve bottle slugs against a data file's table, in order. */
export function resolveBottleRows(
  slugs: string[],
  bottles: Record<string, StoredBottle>,
): BottleRow[] {
  return slugs.flatMap((slug) => {
    const bottle = bottles[slug];
    if (bottle == null) return [];
    const [name, type, hasPage, count] = bottle;
    return [
      { name, slug, count, href: hasPage ? getIngredientUrl({ type, slug }) : undefined },
    ];
  });
}
