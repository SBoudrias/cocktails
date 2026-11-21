import { getMilkClarifiedRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppHeader from '#/components/AppHeader';
import MilkClarificationCalculator from '#/components/calculators/MilkClarificationCalculator';
import TechniqueRecipes from '#/components/calculators/TechniqueRecipes';
import { toRecipeListItems } from '#/modules/recipeListItem';

export const metadata: Metadata = {
  title: 'Indexotica | Milk Clarification Calculator',
};

export default async function MilkClarificationCalculatorPage() {
  const recipes = toRecipeListItems(await getMilkClarifiedRecipes());

  return (
    <>
      <AppHeader title="Milk Clarification" />
      <Suspense>
        <MilkClarificationCalculator />
      </Suspense>
      <TechniqueRecipes
        title="Milk-clarified recipes"
        description="Every recipe whose data marks milk clarification, alphabetically."
        recipes={recipes}
      />
    </>
  );
}
