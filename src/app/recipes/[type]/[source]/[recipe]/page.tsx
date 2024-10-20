import { notFound } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import RecipeDetails from '@/components/RecipeDetails';
import {
  getRecipePageParams,
  getBook,
  getRecipe,
  getYoutubeChannel,
} from '@/modules/entities';
import RecipeSources from '@/components/RecipeSources';
import { SourceType } from '@/types/Source';

type Params = { type: SourceType; source: string; recipe: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getRecipePageParams();
}

export async function generateMetadata({ params }: { params: Params }) {
  try {
    const source =
      params.type === 'book'
        ? await getBook(params.source)
        : await getYoutubeChannel(params.source);
    const recipe = await getRecipe(
      { type: params.type, slug: params.source },
      params.recipe,
    );

    return {
      title: `Cocktail Index | ${recipe.name} from ${source.name}`,
    };
  } catch {
    notFound();
  }
}

export default async function RecipePage({ params }: { params: Params }) {
  const source =
    params.type === 'book'
      ? await getBook(params.source)
      : await getYoutubeChannel(params.source);

  const recipe = await getRecipe(
    { type: params.type, slug: params.source },
    params.recipe,
  );

  return (
    <>
      <AppHeader title={recipe.name} />
      <RecipeDetails recipe={recipe} />
      <RecipeSources source={source} recipe={recipe} />
    </>
  );
}
