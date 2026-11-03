import { getCategory, getChildCategories } from '@cocktails/data/categories';
import { getIngredientsForCategory } from '@cocktails/data/ingredients';
import { getCategoryPageParams } from '@cocktails/data/params';
import { getRecipeByCategory } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import { notFound, unstable_rethrow } from 'next/navigation';
import { Suspense } from 'react';
import { toRecipeCards } from '#/modules/recipeCard';
import CategoryClient from './CategoryClient';

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getCategoryPageParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const category = await getCategory(slug);

    return {
      title: `Cocktail Index | Learn about ${category.name}`,
    };
  } catch (error) {
    unstable_rethrow(error);
    notFound();
  }
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const category = await getCategory(slug);
  const [[members, substitutes], relatedRecipes, childCategories] = await Promise.all([
    getIngredientsForCategory(category),
    getRecipeByCategory(category),
    getChildCategories(category),
  ]);

  const categorySlugs = new Set([category.slug, ...childCategories.map((c) => c.slug)]);

  return (
    <Suspense>
      <CategoryClient
        category={category}
        members={members}
        substitutes={substitutes}
        relatedRecipes={toRecipeCards(
          relatedRecipes,
          (recipe) =>
            recipe.ingredients.find((ingredient) => {
              if (ingredient.type === 'category') {
                return ingredient.slug === category.slug;
              }
              return ingredient.categories.some((c) => categorySlugs.has(c.slug));
            })?.quantity,
        )}
        childCategories={childCategories}
      />
    </Suspense>
  );
}
