import fg from 'fast-glob';
import path from 'node:path';
import fs from 'node:fs/promises';
import { notFound } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import IngredientList from '@/components/IngredientList';
import { Recipe } from '@/types/Recipe';

type Params = { book: string; recipe: string };

const maiTaiRecipe: Recipe = {
  name: 'Mai Tai',
  slug: 'mai-tai',
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

const recipes: Recipe[] = [maiTaiRecipe];

async function getRecipe(book: string, recipe: string): Promise<Recipe> {
  try {
    const file = await fs.readFile(
      `src/data/books/${book}/recipes/${recipe}.json`,
      'utf-8',
    );
    return JSON.parse(file);
  } catch (err) {
    notFound();
  }
}

export async function generateStaticParams(): Promise<Params[]> {
  return fg.sync('src/data/books/*/recipes/*.json').map((entry) => {
    const parts = entry.split('/');
    return { book: parts[3], recipe: path.basename(parts[5], '.json') };
  });
}

export async function generateMetadata({ params }: { params: Params }) {
  const recipe = await getRecipe(params.book, params.recipe);

  return {
    title: `Cocktail Index | ${recipe.name}`,
  };
}

export default async function RecipePage({ params }: { params: Params }) {
  const recipe = await getRecipe(params.book, params.recipe);

  return (
    <>
      <AppHeader title={recipe.name} />
      <IngredientList ingredients={recipe.ingredients} />
    </>
  );
}
