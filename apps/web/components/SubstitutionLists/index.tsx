import type { Category, RootIngredient } from '@cocktails/data';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import type { Route } from 'next';
import { LinkList, LinkListItem } from '#/components/LinkList';
import { ingredientHasData } from '#/modules/hasData';
import { getCategoryUrl, getIngredientUrl } from '#/modules/url';

/**
 * The primary substitution list caps at this many links: a capped list holds
 * one fewer bottle plus the see-all link below as its last item.
 */
const MAX_SUBSTITUTION_LINKS = 15;

/**
 * The substitution lists shared by the ingredient and category pages:
 *
 * - The primary list holds specific bottles from a single category, capped
 *   at 15 links. A capped list shows 14 bottles and closes with a see-all
 *   link, rendered with the category icon so it reads as a jump-off point
 *   rather than one more row.
 * - The secondary list holds the substitution-friendly related categories,
 *   each linking to its category page.
 *
 * Renders nothing when both lists are empty.
 */
export default function SubstitutionLists({
  primaryHeader,
  substitutes,
  seeAll,
  relatedCategories,
}: {
  /** Header of the primary list, e.g. "Some substitution option". */
  primaryHeader: string;
  /** Bottles to list, expected to come from a single category. */
  substitutes: RootIngredient[];
  /** Where the see-all link of a capped primary list goes, with its label. */
  seeAll: {
    href: Route<`/category/${string}`> | Route<`/category/${string}/bottles`>;
    label: string;
  };
  /** Related categories, listed after the primary list. */
  relatedCategories: Category[];
}) {
  if (substitutes.length === 0 && relatedCategories.length === 0) return null;

  const isCapped = substitutes.length >= MAX_SUBSTITUTION_LINKS;

  return (
    <>
      {substitutes.length > 0 && (
        <LinkList
          header={primaryHeader}
          items={substitutes.slice(0, MAX_SUBSTITUTION_LINKS - 1)}
          renderItem={(substitute) => (
            <LinkListItem
              key={substitute.slug}
              href={
                ingredientHasData(substitute) ? getIngredientUrl(substitute) : undefined
              }
              primary={substitute.name}
            />
          )}
          footer={
            isCapped && (
              <LinkListItem
                href={seeAll.href}
                primary={
                  <span>
                    <LocalOfferIcon
                      fontSize="small"
                      sx={{ mr: 1, verticalAlign: 'text-bottom' }}
                    />
                    {seeAll.label}
                  </span>
                }
                secondary="See all options"
              />
            )
          }
        />
      )}
      {relatedCategories.length > 0 && (
        <LinkList
          header="Substitution-friendly categories"
          items={relatedCategories}
          renderItem={(relatedCategory) => (
            <LinkListItem
              key={relatedCategory.slug}
              href={getCategoryUrl(relatedCategory)}
              primary={relatedCategory.name}
            />
          )}
        />
      )}
    </>
  );
}
