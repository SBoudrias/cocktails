import type { Category, RootIngredient } from '@cocktails/data';
import { Tag } from 'lucide-react';
import type { Route } from 'next';
import { LinkList, LinkListItem } from '#/components/LinkList';
import { ingredientHasData } from '#/modules/hasData';
import { getCategoryUrl, getIngredientUrl } from '#/modules/url';

/**
 * The primary substitution list caps at this many links: a capped list holds
 * one fewer bottle plus the see-all link below as its last item.
 */
const MAX_SUBSTITUTION_LINKS = 10;

/**
 * The last row of a capped primary list: the category icon vertically
 * centered to the left of both texts, the category name and the "see all"
 * label stacked as one block beside it.
 */
function SeeAllLink({
  href,
  label,
}: {
  href: Route<`/category/${string}`>;
  label: string;
}) {
  return (
    <LinkListItem
      href={href}
      leading={<Tag className="size-5" />}
      primary={label}
      secondary="See all options"
    />
  );
}

/**
 * The secondary substitution list: the substitution-friendly related
 * categories, each linking to its category page. Also rendered on its own
 * by the category pages, whose full member list is uncapped.
 */
export function RelatedCategoriesList({
  categories,
  sticky = true,
  idPrefix = 'group',
}: {
  categories: Category[];
  /** Passed to the LinkList: false inside the substitution drawer's sheet. */
  sticky?: boolean;
  idPrefix?: string;
}) {
  if (categories.length === 0) return null;

  return (
    <LinkList
      header="Substitution-friendly categories"
      items={categories}
      sticky={sticky}
      idPrefix={idPrefix}
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
 * The substitution lists shared by the ingredient and category pages:
 *
 * - The primary list holds specific bottles from a single category, capped
 *   at 10 links, ordered by how many recipes reference each bottle (the
 *   common bottles lead as recommendations) with the recipe count shown
 *   next to each name. A capped list shows 9 bottles and closes with a
 *   see-all link, rendered with the category icon so it reads as a
 *   jump-off point rather than one more row.
 * - The secondary list holds the substitution-friendly related categories,
 *   each linking to its category page.
 *
 * Renders nothing when both lists are empty.
 */
export default function SubstitutionLists({
  primaryHeader,
  substitutes,
  recipeCounts,
  seeAll,
  relatedCategories,
  sticky = true,
  idPrefix = 'group',
}: {
  /** Header of the primary list, e.g. "Some substitution option". */
  primaryHeader: string;
  /** Bottles to list, expected to come from a single category. */
  substitutes: RootIngredient[];
  /** Recipe reference counts by ingredient slug, shown next to each bottle. */
  recipeCounts: Map<string, number>;
  /** Where the see-all link of a capped primary list goes, with its label. */
  seeAll: {
    href: Route<`/category/${string}`>;
    label: string;
  };
  /** Related categories, listed after the primary list. */
  relatedCategories: Category[];
  /** Passed to the LinkLists: false inside the substitution drawer's sheet. */
  sticky?: boolean;
  idPrefix?: string;
}) {
  if (substitutes.length === 0 && relatedCategories.length === 0) return null;

  const isCapped = substitutes.length >= MAX_SUBSTITUTION_LINKS;

  return (
    <>
      {substitutes.length > 0 && (
        <LinkList
          header={primaryHeader}
          items={substitutes.slice(0, MAX_SUBSTITUTION_LINKS - 1)}
          sticky={sticky}
          idPrefix={idPrefix}
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
          footer={isCapped && <SeeAllLink href={seeAll.href} label={seeAll.label} />}
        />
      )}
      <RelatedCategoriesList
        categories={relatedCategories}
        sticky={sticky}
        idPrefix={idPrefix}
      />
    </>
  );
}
