import { getRecentlyAddedRecipeEntries } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import AppHeader from '#/components/AppHeader';
import RecipeLinkListItem from '#/components/list/RecipeLinkListItem';
import StickyGroupHeader from '#/components/list/StickyGroupHeader';
import { List } from '#/components/ui/list';
import { getRecipeSource } from '#/modules/getRecipeSource';
import { groupByAddedDay } from '#/modules/groupByAddedDay';
import { getRecipeUrl } from '#/modules/url';

export const metadata: Metadata = {
  title: 'Indexotica | Recently Added',
};

export default async function RecentlyAddedPage() {
  const entries = await getRecentlyAddedRecipeEntries();
  const groups = groupByAddedDay(
    entries.map(({ recipe, day }) => ({ day, item: recipe })),
  );

  return (
    <>
      <AppHeader title="Recently Added" />
      <List className="mt-4 py-2">
        {groups.map(({ day, label, items }) => {
          const headerId = `group-header-${day}`;

          return (
            <li key={day}>
              <List role="group" aria-labelledby={headerId}>
                <StickyGroupHeader id={headerId}>{label}</StickyGroupHeader>
                <div className="surface">
                  {items.map((recipe) => (
                    <RecipeLinkListItem
                      key={getRecipeUrl(recipe)}
                      href={getRecipeUrl(recipe)}
                      name={recipe.name}
                      source={getRecipeSource(recipe)}
                    />
                  ))}
                </div>
              </List>
            </li>
          );
        })}
      </List>
    </>
  );
}
