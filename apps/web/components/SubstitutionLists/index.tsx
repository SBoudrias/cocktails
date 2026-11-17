import type { Category, RootIngredient } from '@cocktails/data';
import { type HeaderMode, LinkList, LinkListItem } from '#/components/list/LinkList';
import { ingredientHasData } from '#/modules/hasData';
import { getCategoryUrl, getIngredientUrl } from '#/modules/url';

/**
 * The secondary substitution list: the substitution-friendly related
 * categories, each linking to its category page. Also rendered on its own
 * by the category pages, whose full member list is uncapped.
 */
export function RelatedCategoriesList({
  categories,
  headerMode = 'sticky',
}: {
  categories: Category[];
  /** Passed to the LinkList: 'flow' inside the substitution drawer's sheet. */
  headerMode?: HeaderMode;
}) {
  if (categories.length === 0) return null;

  return (
    <LinkList
      header="Substitution-friendly categories"
      items={categories}
      headerMode={headerMode}
      renderItem={(relatedCategory) => (
        <LinkListItem
          key={relatedCategory.slug}
          href={getCategoryUrl(relatedCategory)}
          primary={relatedCategory.name}
        />
      )}
    />
  );
}

/**
 * The substitution lists held by the ingredient pages' substitution drawer,
 * ordered shortest list first:
 *
 * - The substitution-friendly related categories lead — the always-shorter
 *   list, each linking to its category page.
 * - The primary list follows: every specific bottle from a single category,
 *   uncapped since the drawer scrolls, ordered by how many recipes
 *   reference each bottle (the common bottles lead as recommendations) with
 *   the recipe count shown next to each name.
 *
 * Renders nothing when both lists are empty.
 */
export default function SubstitutionLists({
  primaryHeader,
  substitutes,
  recipeCounts,
  relatedCategories,
  headerMode = 'sticky',
}: {
  /** Header of the primary list, e.g. "Some substitution option". */
  primaryHeader: string;
  /** Bottles to list, expected to come from a single category. */
  substitutes: RootIngredient[];
  /** Recipe reference counts by ingredient slug, shown next to each bottle. */
  recipeCounts: Map<string, number>;
  /** Related categories, listed before the primary list. */
  relatedCategories: Category[];
  /** Passed to the LinkLists: 'flow' inside the substitution drawer's sheet. */
  headerMode?: HeaderMode;
}) {
  if (substitutes.length === 0 && relatedCategories.length === 0) return null;

  return (
    <>
      <RelatedCategoriesList categories={relatedCategories} headerMode={headerMode} />
      {substitutes.length > 0 && (
        <LinkList
          header={primaryHeader}
          items={substitutes}
          headerMode={headerMode}
          renderItem={(substitute) => (
            <LinkListItem
              key={substitute.slug}
              href={
                ingredientHasData(substitute) ? getIngredientUrl(substitute) : undefined
              }
              primary={substitute.name}
              count={recipeCounts.get(substitute.slug) ?? 0}
            />
          )}
        />
      )}
    </>
  );
}
