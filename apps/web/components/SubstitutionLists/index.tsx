import type { Category, RootIngredient } from '@cocktails/data';
import { ChevronRight, Tag } from 'lucide-react';
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
    <Link
      href={href}
      className="relative flex w-full items-center border-x-0 border-t-0 border-b px-4 py-3 pr-12 text-base outline-none transition-colors duration-100 hover:bg-muted focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <Tag className="size-5 shrink-0" />
      <span className="flex min-w-0 flex-1 flex-col gap-1 text-left">
        <span className="min-w-0">{label}</span>
        <span className="text-xs leading-[1.35] text-muted-foreground">
          See all options
        </span>
      </span>
      <ChevronRight className="absolute top-1/2 right-4 size-6 -translate-y-1/2 text-foreground" />
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
              tertiary={
                <span className="text-muted-foreground">
                  {recipeCounts.get(substitute.slug) ?? 0}
                </span>
              }
            />
          )}
          footer={isCapped && <SeeAllLink href={seeAll.href} label={seeAll.label} />}
        />
      )}
      <RelatedCategoriesList categories={relatedCategories} />
    </>
  );
}
