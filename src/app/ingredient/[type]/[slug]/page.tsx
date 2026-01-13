import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getIngredient,
  getRecipesForIngredient,
  getSubstitutesForIngredient,
} from '@/modules/ingredients';
import { getIngredientPageParams } from '@/modules/params';
import IngredientClient from './IngredientClient';

type Params = { type: string; slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getIngredientPageParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { type, slug } = await params;

  try {
    const ingredient = await getIngredient(type, slug);

    return {
      title: `Cocktail Index | Learn about ${ingredient.name}`,
    };
  } catch {
    notFound();
  }
}

export default async function IngredientPage({ params }: { params: Promise<Params> }) {
  const { type, slug } = await params;

  const ingredient = await getIngredient(type, slug);
  const substitutes = await getSubstitutesForIngredient(ingredient);
  const relatedRecipes = await getRecipesForIngredient(ingredient);

  return (
    <IngredientClient
      ingredient={ingredient}
      substitutes={substitutes}
      relatedRecipes={relatedRecipes}
    />
  );
}
