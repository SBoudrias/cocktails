import { useId } from 'react';
import { LinkListItem } from '#/components/list/LinkList';
import StickyGroupHeader from '#/components/list/StickyGroupHeader';
import ListDrawer from '#/components/ListDrawer';
import SubstitutionLists, {
  type RelatedCategoryRow,
} from '#/components/SubstitutionLists';
import { List } from '#/components/ui/list';
import type { BottleRow } from '#/modules/bottleRows';
import { getCategoryUrl } from '#/modules/url';

/**
 * How many substitution rows fit on the page as-is: bottles plus
 * substitution-friendly categories at or under this count render as the
 * plain lists, no trigger, no drawer. (241 of 1465 ingredient pages; a
 * drawer behind three rows is ceremony.)
 */
const INLINE_LIMIT = 5;

/**
 * How many substitute bottles the page previews above the see-all row:
 * the most-used bottles — the preview doubles as a recommendation, the
 * same ordering the drawer's full list shows.
 */
const PREVIEW_COUNT = 3;

function renderSubstitute(substitute: BottleRow) {
  return (
    <LinkListItem
      key={substitute.slug}
      href={substitute.href}
      primary={substitute.name}
      count={substitute.count}
    />
  );
}

function renderRelatedCategory(relatedCategory: RelatedCategoryRow) {
  return (
    <LinkListItem
      key={relatedCategory.slug}
      href={getCategoryUrl(relatedCategory)}
      primary={relatedCategory.name}
    />
  );
}

/**
 * A bottle page's substitution section — the same shape the category
 * pages give their member bottles — two forms by size:
 *
 * - Small content (≤5 rows across both lists) keeps the plain lists on
 *   the page: the substitution-friendly categories first, then the
 *   bottles, every row a direct link.
 * - Larger content shows the three most-used substitute bottles as plain
 *   rows — real content, each a direct link — with a see-all row that
 *   opens the drawer holding the full lists: the categories first, then
 *   every bottle, uncapped since the sheet scrolls. The sheet's content
 *   stays mounted while closed (keepMounted), so every substitution link
 *   remains in the static export's HTML for crawlers.
 *
 * Renders nothing when the caller passes no substitution content (a
 * solitary bottle whose categories hold no other members and sit nowhere
 * in the tree).
 */
export default function SubstitutionSection({
  ingredientName,
  substitutes,
  relatedCategories,
}: {
  /** The bottle whose substitutes the section lists. */
  ingredientName: string;
  /** Every bottle sharing one of the bottle's declared categories,
   * most-used first (getSubstitutesForIngredient), each with its recipe
   * count shown next to its name. */
  substitutes: BottleRow[];
  /** Substitution-friendly related categories, listed first. */
  relatedCategories: RelatedCategoryRow[];
}) {
  const headerId = useId();
  const total = substitutes.length + relatedCategories.length;

  if (total === 0) return null;

  // The small shape: both lists fit on the page — render them as-is.
  if (total <= INLINE_LIMIT) {
    return (
      <SubstitutionLists
        primaryHeader="Some substitution option"
        substitutes={substitutes}
        relatedCategories={relatedCategories}
      />
    );
  }

  // The large shape: three preview rows inside the same surface block,
  // the see-all row as its last row and the drawer's trigger. The
  // bottles lead — the most-used substitutes double as recommendations —
  // and a page with fewer than three of them pads the preview with the
  // leading related categories (a bottle sitting in a non-substituting
  // family can hold categories and no sibling bottles at all).
  const bottleRows = Math.min(substitutes.length, PREVIEW_COUNT);
  const preview = [
    ...substitutes.slice(0, PREVIEW_COUNT).map(renderSubstitute),
    ...relatedCategories.slice(0, PREVIEW_COUNT - bottleRows).map(renderRelatedCategory),
  ];

  return (
    <List>
      <li>
        <List role="group" aria-labelledby={headerId}>
          <StickyGroupHeader id={headerId}>
            Substitutes for {ingredientName}
          </StickyGroupHeader>
          <div className="surface">
            {preview}
            <li>
              <ListDrawer
                title="Substitutions"
                description={`Bottles and substitution-friendly categories to use in place of ${ingredientName}.`}
                closeLabel="Close substitutions"
                trigger={`See all ${total} substitutions`}
                triggerClassName="flex w-full items-center justify-center gap-1 px-4 py-3 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                keepContentMounted
              >
                <SubstitutionLists
                  primaryHeader="Some substitution option"
                  substitutes={substitutes}
                  relatedCategories={relatedCategories}
                  headerMode="flow"
                />
              </ListDrawer>
            </li>
          </div>
        </List>
      </li>
    </List>
  );
}
