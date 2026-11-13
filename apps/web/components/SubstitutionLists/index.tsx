import type { Category, RootIngredient } from '@cocktails/data';
import ChevronRight from '@mui/icons-material/ChevronRight';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { ListItem, ListItemText, Stack } from '@mui/material';
import type { Route } from 'next';
import Link from 'next/link';
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
    <Link href={href}>
      <ListItem divider secondaryAction={<ChevronRight />}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', width: '100%' }}>
          <LocalOfferIcon fontSize="small" />
          <ListItemText primary={label} secondary="See all options" />
        </Stack>
      </ListItem>
    </Link>
  );
}

/**
 * The secondary substitution list: the substitution-friendly related
 * categories, each linking to its category page. Also rendered on its own
 * by the category pages, whose full member list is uncapped.
 */
export function RelatedCategoriesList({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <LinkList
      header="Substitution-friendly categories"
      items={categories}
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
 *   at 10 links. A capped list shows 9 bottles and closes with a see-all
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
    href: Route<`/category/${string}`>;
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
          footer={isCapped && <SeeAllLink href={seeAll.href} label={seeAll.label} />}
        />
      )}
      <RelatedCategoriesList categories={relatedCategories} />
    </>
  );
}
