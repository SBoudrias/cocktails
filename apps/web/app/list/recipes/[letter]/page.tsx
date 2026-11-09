import { getAllRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLetterSlug, getLetters } from '#/modules/lists/letters';
import { toRecipeListItems } from '#/modules/recipeListItem';
import RecipesClient from '../RecipesClient';

type Params = { letter: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getLetters(await getAllRecipes()).map(({ slug }) => ({ letter: slug }));
}

function getTitle(letter: { label: string }) {
  return letter.label === '#'
    ? 'Recipes starting with a number'
    : `Recipes starting with ${letter.label}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { letter: slug } = await params;
  const letter = getLetters(await getAllRecipes()).find((l) => l.slug === slug);

  if (!letter) {
    notFound();
  }

  return { title: `Cocktail Index | ${getTitle(letter)}` };
}

export default async function RecipesLetterPage({ params }: { params: Promise<Params> }) {
  const { letter: slug } = await params;
  const recipes = await getAllRecipes();
  const letters = getLetters(recipes);
  const letter = letters.find((l) => l.slug === slug);

  if (!letter) {
    notFound();
  }

  return (
    <RecipesClient
      title={getTitle(letter)}
      letters={letters}
      page={{
        letter: slug,
        recipes: toRecipeListItems(
          recipes.filter((recipe) => getLetterSlug(recipe) === slug),
        ),
      }}
    />
  );
}
