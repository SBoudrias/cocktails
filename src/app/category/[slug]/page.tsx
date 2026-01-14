import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Suspense } from 'react';
import { getCategory, getChildCategories } from '@/modules/categories';
import { CATEGORY_ROOT } from '@/modules/constants';
import { getIngredientsForCategory } from '@/modules/ingredients';
import { getRecipeByCategory } from '@/modules/recipes';
import CategoryClient from './CategoryClient';

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const params = [];

  for await (const dataFilePath of await fs.readdir(CATEGORY_ROOT)) {
    const categorySlug = path.basename(dataFilePath, '.json');
    params.push({
      slug: categorySlug,
    });
  }

  return params;
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
