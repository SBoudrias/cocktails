import type { Category, RootIngredient } from '@cocktails/data';
import { useId } from 'react';
import { LinkListItem } from '#/components/list/LinkList';
import StickyGroupHeader from '#/components/list/StickyGroupHeader';
import ListDrawer from '#/components/ListDrawer';
import { List, ListSubheader } from '#/components/ui/list';
import { ingredientHasData } from '#/modules/hasData';
import { getIngredientUrl } from '#/modules/url';

/**
 * Categories whose member list fits on the page as-is: 5 bottles or fewer
 * render the plain list, no trigger, no drawer. (The median category holds
 * 3 members; only 21 of 251 carry more than 15.)
 */
const INLINE_MEMBER_LIMIT = 5;

/**
 * How many member bottles the category page previews above the see-all
 * row: the most-used bottles — the preview doubles as a recommendation,
 * the same ordering the full list shows.
 */
const PREVIEW_COUNT = 3;

function renderMember(member: RootIngredient, recipeCounts: Map<string, number>) {
  return (
    <LinkListItem
      key={member.slug}
      href={ingredientHasData(member) ? getIngredientUrl(member) : undefined}
      primary={member.name}
      count={recipeCounts.get(member.slug) ?? 0}
    />
  );
}

/**
 * A category's member bottles on its page, two shapes by size:
 *
 * - Small categories (≤5 members) keep the plain uncapped list — a drawer
 *   behind a trigger would be ceremony over three rows.
 * - Larger categories show the three most-used bottles as plain rows —
 *   real content, each a direct link — with a see-all row that opens the
 *   drawer holding the full list. The sheet's content stays mounted while
 *   closed (keepMounted), so every bottle link remains in the static
 *   export's HTML for crawlers.
 */
export default function CategoryMembers({
  category,
  members,
  recipeCounts,
}: {
  category: Category;
  /** Every member bottle, most-used first (getIngredientsForCategory). */
  members: RootIngredient[];
  /** Recipe reference counts by ingredient slug, shown next to each name. */
  recipeCounts: Map<string, number>;
}) {
  const headerId = useId();
  const header = `Examples of ${category.name}`;

  if (members.length === 0) return null;

  // The small-category shape: today's plain list, unchanged.
  if (members.length <= INLINE_MEMBER_LIMIT) {
    return (
      <List>
        <li>
          <List role="group" aria-labelledby={headerId}>
            <StickyGroupHeader id={headerId}>{header}</StickyGroupHeader>
            <div className="surface">
              {members.map((member) => renderMember(member, recipeCounts))}
            </div>
          </List>
        </li>
      </List>
    );
  }

  // The large-category shape: three preview rows inside the same surface
  // block, the see-all row as its last row and the drawer's trigger.
  const preview = members.slice(0, PREVIEW_COUNT);

  return (
    <List>
      <li>
        <List role="group" aria-labelledby={headerId}>
          <StickyGroupHeader id={headerId}>{header}</StickyGroupHeader>
          <div className="surface">
            {preview.map((member) => renderMember(member, recipeCounts))}
            <li>
              <ListDrawer
                title={`${category.name} bottles`}
                description={`Every bottle filed under ${category.name}, its child categories included — the most-used first.`}
                keepContentMounted
                trigger={`See all ${members.length} bottles`}
                triggerClassName="flex w-full items-center justify-center gap-1 px-4 py-3 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <List>
                  <li>
                    <List role="group" aria-labelledby={`${headerId}-sheet`}>
                      <li id={`${headerId}-sheet`}>
                        <ListSubheader>{header}</ListSubheader>
                      </li>
                      <div className="surface">
                        {members.map((member) => renderMember(member, recipeCounts))}
                      </div>
                    </List>
                  </li>
                </List>
              </ListDrawer>
            </li>
          </div>
        </List>
      </li>
    </List>
  );
}
