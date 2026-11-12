import { getRecentlyAddedRecipeEntries } from '@cocktails/data/recipes';
import { List, ListSubheader, Paper } from '@mui/material';
import type { Metadata } from 'next';
import AppHeader from '#/components/AppHeader';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
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
      <List sx={{ mt: 2 }}>
        {groups.map(({ day, label, items }) => {
          const headerId = `group-header-${day}`;

          return (
            <li key={day}>
              <List role="group" aria-labelledby={headerId}>
                <ListSubheader id={headerId} disableSticky={false}>
                  {label}
                </ListSubheader>
                <Paper square>
                  {items.map((recipe) => (
                    <RecipeLinkListItem
                      key={getRecipeUrl(recipe)}
                      href={getRecipeUrl(recipe)}
                      name={recipe.name}
                      source={getRecipeSource(recipe)}
                    />
                  ))}
                </Paper>
              </List>
            </li>
          );
        })}
      </List>
    </>
  );
}
