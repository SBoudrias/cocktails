import type { Source } from '@cocktails/data';
import { getSourcePageParams } from '@cocktails/data/params';
import { getRecipesFromSource } from '@cocktails/data/recipes';
import { getSource } from '@cocktails/data/sources';
import { notFound, unstable_rethrow } from 'next/navigation';
import SearchableRecipePage from '#/components/SearchableRecipePage';
import SourceAboutCard from '#/components/SourceAboutCard';
import { toRecipeListItems } from '#/modules/recipeListItem';
import BookSourceClient from './BookSourceClient';

type Params = { type: Source['type']; name: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getSourcePageParams();
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { type, name } = await params;

  try {
    const source = await getSource(type, name);

    return {
      title: `Indexotica | ${source.name}`,
      description: source.description,
    };
  } catch (error) {
    unstable_rethrow(error);
    notFound();
  }
}

export default async function SourcePage({ params }: { params: Promise<Params> }) {
  const { type, name } = await params;

  const source = await getSource(type, name);
  const recipes = toRecipeListItems(await getRecipesFromSource(source));

  return source.type === 'book' ? (
    <BookSourceClient source={source} recipes={recipes} />
  ) : (
    <SearchableRecipePage recipes={recipes} listHeader="All Recipes">
      <SourceAboutCard source={source} sx={{ m: 2 }} />
    </SearchableRecipePage>
  );
}
