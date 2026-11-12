import { getAllCategories } from '@cocktails/data/categories';
import { getAllIngredients } from '@cocktails/data/ingredients';
import type { Metadata } from 'next';
import { toIngredientListItems } from '#/modules/ingredientListItem';
import IngredientsClient from './IngredientsClient';

export const metadata: Metadata = {
  title: 'Indexotica | Ingredient list',
};

export default async function IngredientListPage() {
  const [allIngredients, allCategories] = await Promise.all([
    getAllIngredients(),
    getAllCategories(),
  ]);
  const ingredients = allIngredients.filter((ingredient) => {
    return (
      ingredient.type !== 'liqueur' &&
      ingredient.type !== 'spirit' &&
      ingredient.type !== 'non-alcoholic'
    );
  });

  return (
    <IngredientsClient
      ingredients={toIngredientListItems([...ingredients, ...allCategories])}
    />
  );
}
