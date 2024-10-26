import { notFound } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import IngredientDetails from '@/components/IngredientDetails';
import { getIngredient, getSubstitutesForIngredient } from '@/modules/ingredients';
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
  const substitutes = await getSubstitutesForIngredient(ingredient);

  return (
    <>
      <AppHeader title={ingredient.name} />
      <IngredientDetails ingredient={ingredient} substitutes={substitutes} />
    </>
  );
}
