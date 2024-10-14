import fg from 'fast-glob';
import path from 'node:path';
import { notFound } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import IngredientList from '@/components/IngredientList';
import { getBook, getRecipe, getYoutubeChannel } from '@/modules/entities';
import RecipeSources from '@/components/RecipeSources';
import { SourceType } from '@/types/Source';

type Params = { type: SourceType; source: string; recipe: string };

export async function generateStaticParams(): Promise<Params[]> {
  return [
    ...fg.sync('src/data/book/*/recipes/*.json').map((entry): Params => {
      const parts = entry.split('/');
      return { type: 'book', source: parts[3], recipe: path.basename(parts[5], '.json') };
    }),
    ...fg.sync('src/data/youtube-channel/*/recipes/*.json').map((entry): Params => {
      const parts = entry.split('/');
      return {
        type: 'youtube-channel',
        source: parts[3],
        recipe: path.basename(parts[5], '.json'),
      };
    }),
  ];
}

export async function generateMetadata({ params }: { params: Params }) {
  const source =
    params.type === 'book'
      ? await getBook(params.source)
      : await getYoutubeChannel(params.source);
  const recipe = await getRecipe(
    { type: params.type, slug: params.source },
    params.recipe,
  );
  if (!source || !recipe) {
    notFound();
  }

  return {
    title: `Cocktail Index | ${recipe.name} from ${source.name}`,
  };
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
  if (!source || !recipe) {
    notFound();
  }

  return (
    <>
      <AppHeader title={recipe.name} />
      <IngredientList ingredients={recipe.ingredients} />
      <RecipeSources source={source} recipe={recipe} />
    </>
  );
}
