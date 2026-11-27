import { getAllIngredients } from '@cocktails/data/ingredients';
import { getFatWashedRecipes } from '@cocktails/data/recipes';
import slugify from '@sindresorhus/slugify';
import type { Metadata, Route } from 'next';
import { Suspense } from 'react';
import AppHeader from '#/components/AppHeader';
import FatWashCalculator from '#/components/calculators/FatWashCalculator';
import TechniqueRecipes from '#/components/calculators/TechniqueRecipes';
import { FAT_TYPES, getFatWashIngredients } from '#/modules/fatWash';
import { toRecipeListItems } from '#/modules/recipeListItem';

export const metadata: Metadata = {
  title: 'Indexotica | Fat Wash Calculator',
};

export default async function FatWashCalculatorPage() {
  const [fatWashedRecipes, allIngredients] = await Promise.all([
    getFatWashedRecipes(),
    getAllIngredients(),
  ]);

  const fatSlugs = new Set<string>(
    FAT_TYPES.filter((fat) => fat !== 'Other fat').map((fat) => slugify(fat)),
  );
  for (const recipe of fatWashedRecipes) {
    for (const { fatWash } of getFatWashIngredients(recipe.ingredients)) {
      fatSlugs.add(slugify(fatWash.fat));
    }
  }

  const fatUrls: Record<string, Route<`/ingredient/${string}/${string}`>> = {};
  for (const ingredient of allIngredients) {
    if (fatSlugs.has(ingredient.slug)) {
      fatUrls[ingredient.slug] = `/ingredient/${ingredient.type}/${ingredient.slug}`;
    }
  }

  const recipes = toRecipeListItems(fatWashedRecipes);

  return (
    <>
      <AppHeader title="Fat Wash" />
      <Suspense>
        <FatWashCalculator fatUrls={fatUrls} />
      </Suspense>
      <TechniqueRecipes
        title="Fat-washed recipes"
        description="Every recipe with a fat-washed ingredient, alphabetically."
        recipes={recipes}
      />
    </>
  );
}
