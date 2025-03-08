import { Metadata } from 'next';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { Suspense } from 'react';
import { getAllIngredients } from '@/modules/ingredients';
import { List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import { getIngredientUrl } from '@/modules/url';
import { ChevronRight } from '@mui/icons-material';
import { getAllCategories } from '@/modules/categories';
import groupByFirstLetter from '@/modules/groupByFirstLetter';

export const metadata: Metadata = {
  title: 'Cocktail Index | Ingredient list',
};

export default async function IngredientListPage() {
  const allIngredients = await getAllIngredients();
  const allCategories = await getAllCategories();
  const ingredients = allIngredients.filter((ingredient) => {
    return ingredient.type !== 'liqueur' && ingredient.type !== 'spirit';
  });

  const ingredientGroups = groupByFirstLetter([...ingredients, ...allCategories]);

  return (
    <Suspense>
      <AppHeader title="All Ingredients" />
      <List>
        {ingredientGroups.map(([letter, ingredients]) => {
          if (!Array.isArray(ingredients)) return null;

          return (
            <List key={letter}>
              <ListSubheader>{letter}</ListSubheader>
              <Paper square>
                {ingredients.map((ingredient) => (
                  <Link href={getIngredientUrl(ingredient)} key={ingredient.slug}>
                    <ListItem divider secondaryAction={<ChevronRight />}>
                      <ListItemText
                        primary={ingredient.name}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </ListItem>
                  </Link>
                ))}
              </Paper>
            </List>
          );
        })}
      </List>
    </Suspense>
  );
}
