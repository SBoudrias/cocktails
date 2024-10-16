import fg from 'fast-glob';
import path from 'node:path';
import { notFound } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { getIngredient } from '@/modules/entities';

type Params = { type: string; name: string };

export async function generateStaticParams(): Promise<Params[]> {
  return fg.sync('src/data/ingredient/*/*.json').map((entry): Params => {
    const parts = entry.split('/');
    return { type: parts[3], name: path.basename(parts[4], '.json') };
  });
}

export async function generateMetadata({ params }: { params: Params }) {
  try {
    const ingredient = await getIngredient(params.type, params.name);

    return {
      title: `Cocktail Index | Learn about ${ingredient}`,
    };
  } catch {
    notFound();
  }
}

export default async function IngredientPage({ params }: { params: Params }) {
  const ingredient = await getIngredient(params.type, params.name);

  // TODO: Add description + videos about ingredient
  // TODO: Add list of recipes that use this ingredient
  // TODO: Add substitution information

  return (
    <>
      <AppHeader title={ingredient.name} />
    </>
  );
}
