import { type HeaderMode, LinkList, LinkListItem } from '#/components/list/LinkList';
import type { BottleRow } from '#/modules/bottleRows';
import { getCategoryUrl } from '#/modules/url';

/** A substitution-friendly category as its row shows it. */
export type RelatedCategoryRow = { name: string; slug: string };

/**
 * The secondary substitution list: the substitution-friendly related
 * categories, each linking to its category page. Rendered inside the
 * substitution drawer's sheet on the ingredient pages.
 */
function RelatedCategoriesList({
  categories,
  headerMode = 'sticky',
}: {
  categories: RelatedCategoryRow[];
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
  relatedCategories,
  headerMode = 'sticky',
}: {
  /** Header of the primary list, e.g. "Some substitution option". */
  primaryHeader: string;
  /** Bottles to list, expected to come from a single category, each with
   * its recipe count shown next to its name. */
  substitutes: BottleRow[];
  /** Related categories, listed before the primary list. */
  relatedCategories: RelatedCategoryRow[];
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
              href={substitute.href}
              primary={substitute.name}
              count={substitute.count}
            />
          )}
        />
      )}
    </>
  );
}
