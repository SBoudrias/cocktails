import { getCategory } from '@cocktails/data/categories';
import { getIngredientsForCategory } from '@cocktails/data/ingredients';
import { getCategoryBottlesPageParams } from '@cocktails/data/params';
import type { Metadata } from 'next';
import { notFound, unstable_rethrow } from 'next/navigation';
import { MAX_SUBSTITUTION_LINKS } from '#/components/SubstitutionLists';
import { toIngredientListItems } from '#/modules/ingredientListItem';
import CategoryBottlesClient from './CategoryBottlesClient';

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getCategoryBottlesPageParams(MAX_SUBSTITUTION_LINKS);
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
      title: `Cocktail Index | Bottles of ${category.name}`,
      description: `Every ${category.name} bottle in the index, searchable.`,
    };
  } catch (error) {
    unstable_rethrow(error);
    notFound();
  }
}

export default async function CategoryBottlesPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;

  const category = await getCategory(slug);
  const members = await getIngredientsForCategory(category);

  return (
    <CategoryBottlesClient
      title={`${category.name} bottles`}
      bottles={toIngredientListItems(members)}
    />
  );
}
