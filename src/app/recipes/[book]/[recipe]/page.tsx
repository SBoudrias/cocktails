import fg from 'fast-glob';
import path from 'node:path';
import { notFound } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import IngredientList from '@/components/IngredientList';
import { getBook, getRecipe } from '@/modules/entities';
import RecipeSources from '@/components/RecipeSources';

type Params = { book: string; recipe: string };

export async function generateStaticParams(): Promise<Params[]> {
  return fg.sync('src/data/books/*/recipes/*.json').map((entry) => {
    const parts = entry.split('/');
    return { book: parts[3], recipe: path.basename(parts[5], '.json') };
  });
}

export async function generateMetadata({ params }: { params: Params }) {
  const book = await getBook(params.book);
  const recipe = await getRecipe(params.book, params.recipe);
  if (!book || !recipe) {
    notFound();
  }

  return {
    title: `Cocktail Index | ${recipe.name} from ${book.name}`,
  };
}

export default async function RecipePage({ params }: { params: Params }) {
  const book = await getBook(params.book);
  const recipe = await getRecipe(params.book, params.recipe);
  if (!book || !recipe) {
    notFound();
  }

  return (
    <>
      <AppHeader title={recipe.name} />
      <IngredientList ingredients={recipe.ingredients} />
      <RecipeSources book={book} />
    </>
  );
}
