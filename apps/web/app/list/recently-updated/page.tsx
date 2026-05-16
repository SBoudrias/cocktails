import { getRecentlyUpdatedRecipes } from '@cocktails/data/recipes';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { List, ListItem, ListItemText, Paper } from '@mui/material';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import AppHeader from '#/components/AppHeader';
import { getRecipeUrl } from '#/modules/url';

export const metadata: Metadata = {
  title: 'Cocktail Index | Recently Updated',
};

export default async function RecentlyUpdatedPage() {
  const recipes = await getRecentlyUpdatedRecipes();

  return (
    <Suspense>
      <AppHeader title="Recently Updated" />
      <List sx={{ mt: 2 }}>
        <Paper square>
          {recipes.map((recipe) => (
            <Link href={getRecipeUrl(recipe)} key={getRecipeUrl(recipe)}>
              <ListItem divider secondaryAction={<ChevronRightIcon />}>
                <ListItemText primary={recipe.name} secondary={recipe.source.name} />
              </ListItem>
            </Link>
          ))}
        </Paper>
      </List>
    </Suspense>
  );
}
