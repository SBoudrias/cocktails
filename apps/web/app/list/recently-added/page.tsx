import { getRecentlyAddedRecipes } from '@cocktails/data/recipes';
import { List, Paper } from '@mui/material';
import type { Metadata } from 'next';
import AppHeader from '#/components/AppHeader';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
import { getRecipeSource } from '#/modules/getRecipeSource';
import { getRecipeUrl } from '#/modules/url';

export const metadata: Metadata = {
  title: 'Cocktail Index | Recently Added',
};

export default async function RecentlyAddedPage() {
  const recipes = await getRecentlyAddedRecipes();

  return (
    <>
      <AppHeader title="Recently Added" />
      <List sx={{ mt: 2 }}>
        <Paper square>
          {recipes.map((recipe) => (
            <RecipeLinkListItem
              key={getRecipeUrl(recipe)}
              href={getRecipeUrl(recipe)}
              name={recipe.name}
              source={getRecipeSource(recipe)}
            />
          ))}
        </Paper>
      </List>
    </>
  );
}
