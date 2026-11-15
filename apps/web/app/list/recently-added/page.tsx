import { getRecentlyAddedRecipeEntries } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import AppHeader from '#/components/AppHeader';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
import StickyGroupHeader from '#/components/StickyGroupHeader';
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
      <ul className="mt-4 py-2">
        {groups.map(({ day, label, items }) => {
          const headerId = `group-header-${day}`;

          return (
            <li key={day}>
              <ul role="group" aria-labelledby={headerId} className="py-2">
                <StickyGroupHeader id={headerId}>{label}</StickyGroupHeader>
                <div className="bg-card">
                  {items.map((recipe) => (
                    <RecipeLinkListItem
                      key={getRecipeUrl(recipe)}
                      href={getRecipeUrl(recipe)}
                      name={recipe.name}
                      source={getRecipeSource(recipe)}
                    />
                  ))}
                </div>
              </ul>
            </li>
          );
        })}
      </ul>
    </>
  );
}
