import { notFound } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import RecipeDetails from '@/components/RecipeDetails';
import { getRecipe } from '@/modules/recipes';
import { getRecipePageParams } from '@/modules/params';
import RecipeSources from '@/components/RecipeSources';
import { SourceType } from '@/types/Source';

type Params = { type: SourceType; source: string; recipe: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getRecipePageParams();
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { type, source, recipe: recipeSlug } = await params;

  try {
    const recipe = await getRecipe({ type: type, slug: source }, recipeSlug);

    return {
      title: `Cocktail Index | ${recipe.name} from ${recipe.source.name}`,
    };
  } catch {
    notFound();
  }
}

export default async function RecipePage({ params }: { params: Promise<Params> }) {
  const { type, source, recipe: recipeSlug } = await params;
  const recipe = await getRecipe({ type: type, slug: source }, recipeSlug);

  return (
    <>
      <AppHeader title={recipe.name} />
      <RecipeDetails recipe={recipe} />
      <RecipeSources recipe={recipe} />
    </>
  );
}
