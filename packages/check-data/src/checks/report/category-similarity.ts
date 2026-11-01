/**
 * Category names that differ only by a trailing generic class word are often
 * the same product class registered twice (e.g. "Ginger" and "Ginger
 * liqueur", both liqueur categories). Such duplicates split recipes and
 * bottles across two category pages.
 *
 * There is one sanctioned exception: a generic parent category grouping
 * substitution-friendly variants (e.g. "Falernum" with children "Falernum
 * liqueur" and "Falernum syrup"). That relationship must be declared
 * explicitly via `parents`, which exempts the pair from this check.
 *
 * The comparison only pairs categories of the same `categoryType`: a liqueur
 * and a syrup sharing a base name are genuinely different products (e.g.
 * "Falernum liqueur" and "Falernum syrup").
 */
const GENERIC_SUFFIXES = ['liqueur', 'syrup', 'wine', 'spirit'] as const;

export interface CategoryLike {
  name: string;
  categoryType: string;
  parents?: readonly string[];
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

function isDeclaredChildOf(parent: CategoryLike, child: CategoryLike): boolean {
  return (child.parents ?? []).some(
    (name) => normalizeName(name) === normalizeName(parent.name),
  );
}

/**
 * Find category pairs of the same categoryType where one name is the other
 * followed by a generic class word.
 */
export function findRedundantCategoryPairs<T extends CategoryLike>(
  categories: readonly T[],
): Array<{ a: T; b: T }> {
  const normalized = categories.map((category) => ({
    category,
    normalizedName: normalizeName(category.name),
  }));

  const pairs: Array<{ a: T; b: T }> = [];
  for (const [i, a] of normalized.entries()) {
    for (const b of normalized.slice(i + 1)) {
      if (a.category.categoryType !== b.category.categoryType) continue;
      if (a.normalizedName === b.normalizedName) continue;

      // A generic parent category with substitution-friendly children is a
      // valid hierarchy, as long as the relationship is declared via parents.
      if (
        isDeclaredChildOf(a.category, b.category) ||
        isDeclaredChildOf(b.category, a.category)
      ) {
        continue;
      }

      for (const suffix of GENERIC_SUFFIXES) {
        const suffixed = `${a.normalizedName} ${suffix}`;
        if (
          suffixed === b.normalizedName ||
          `${b.normalizedName} ${suffix}` === a.normalizedName
        ) {
          pairs.push({ a: a.category, b: b.category });
          break;
        }
      }
    }
  }

  return pairs;
}
