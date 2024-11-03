import fs from 'node:fs/promises';
import path from 'node:path';
import { notFound } from 'next/navigation';
import { getCategory } from '@/modules/categories';
import { CATEGORY_ROOT } from '@/modules/constants';
import AppHeader from '@/components/AppHeader';
import CategoryDetails from './CategoryDetails';
import { getIngredientsForCategory } from '@/modules/ingredients';

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

export async function generateMetadata({ params }: { params: Promise<Params> }) {
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

export default async function IngredientPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const category = await getCategory(slug);
  const ingredients = await getIngredientsForCategory(slug);

  return (
    <>
      <AppHeader title={category.name} />
      <CategoryDetails category={category} ingredients={ingredients} />
    </>
  );
}
