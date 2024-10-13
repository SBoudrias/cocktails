import { notFound } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import IngredientList from '@/components/IngredientList';
import { Recipe } from '@/types/Recipe';

type Params = { slug: string };

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

async function getRecipe(slug: string): Promise<Recipe> {
  const recipe = recipes.find((recipe) => recipe.slug === slug);

  if (!recipe) {
    notFound();
  }

  return recipe;
}

export async function generateStaticParams(): Promise<Params[]> {
  return [{ slug: 'mai-tai' }];
}

export async function generateMetadata({ params }: { params: Params }) {
  const recipe = await getRecipe(params.slug);

  return {
    title: `Cocktail Index | ${recipe.name}`,
  };
}

export default async function RecipePage({ params }: { params: Params }) {
  const recipe = await getRecipe(params.slug);

  return (
    <>
      <AppHeader title={recipe.name} />
      <IngredientList ingredients={recipe.ingredients} />
    </>
  );
}
