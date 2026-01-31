import type { Metadata } from 'next';
import { getCategory, getChildCategories } from '@cocktails/data/categories';
import { getIngredientsForCategory } from '@cocktails/data/ingredients';
import { getCategoryPageParams } from '@cocktails/data/params';
import { getRecipeByCategory } from '@cocktails/data/recipes';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
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
  } catch {
    notFound();
  }
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const category = await getCategory(slug);
  const [members, substitutes] = await getIngredientsForCategory(category);
  const relatedRecipes = await getRecipeByCategory(category);
  const childCategories = await getChildCategories(category);

  return (
    <Suspense>
      <CategoryClient
        category={category}
        members={members}
        substitutes={substitutes}
        relatedRecipes={relatedRecipes}
        childCategories={childCategories}
      />
    </Suspense>
  );
}
