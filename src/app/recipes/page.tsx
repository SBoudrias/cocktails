import AppHeader from '@/components/AppHeader';
import IngredientList from '@/components/IngredientList';
import { Recipe } from '@/types/Recipe';

const recipe: Recipe = {
  name: 'Mai Tai',
  ingredients: [
    {
      name: 'Rum',
      type: 'spirit',
      quantity: {
        amount: 2,
        unit: 'oz',
      },
    },
    {
      name: 'Fresh lime juice',
      type: 'juice',
      quantity: {
        amount: 0.75,
        unit: 'oz',
      },
    },
    {
      name: 'Orgeat syrup',
      type: 'syrup',
      quantity: {
        amount: 0.5,
        unit: 'oz',
      },
    },
    {
      name: 'Orange curaçao',
      type: 'liqueur',
      quantity: {
        amount: 0.5,
        unit: 'oz',
      },
    },
  ],
};

export default function RecipePage() {
  return (
    <>
      <AppHeader title={recipe.name} />
      <IngredientList ingredients={recipe.ingredients} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: `Cocktail Index | ${recipe.name}`,
  };
}
