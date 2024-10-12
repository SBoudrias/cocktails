'use client';

import IngredientList from '@/components/IngredientList';
import { Recipe } from '@/types/Recipe';
import { NavBar } from 'antd-mobile';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  return (
    <>
      <NavBar onBack={() => router.back()}>{recipe.name}</NavBar>
      <IngredientList ingredients={recipe.ingredients} />
      {/* <List header="Ingredients">
        {recipe.ingredients.map((ingredient) => (
          <List.Item key={ingredient.name}>
            {ingredient.quantity.amount} {ingredient.quantity.unit} {ingredient.name}
          </List.Item>
        ))}
      </List> */}
    </>
  );
}
