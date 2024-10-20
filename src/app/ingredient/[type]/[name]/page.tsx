import { notFound } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import IngredientDetails from '@/components/IngredientDetails';
import { getIngredient } from '@/modules/entities';
import { getIngredientPageParams } from '@/modules/params';

type Params = { type: string; name: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getIngredientPageParams();
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
      <IngredientDetails ingredient={ingredient} />
    </>
  );
}
