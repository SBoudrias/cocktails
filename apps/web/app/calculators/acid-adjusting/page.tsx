import { getAcidAdjustedRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppHeader from '#/components/AppHeader';
import AcidAdjustingCalculator from '#/components/calculators/AcidAdjustingCalculator';
import TechniqueRecipes from '#/components/calculators/TechniqueRecipes';
import { Card, CardContent } from '#/components/ui/card';
import Video from '#/components/Video';
import { toRecipeListItems } from '#/modules/recipeListItem';

export const metadata: Metadata = {
  title: 'Indexotica | Acid Adjusting',
};

export default async function CalculatorsPage() {
  const recipes = toRecipeListItems(await getAcidAdjustedRecipes());

  return (
    <>
      <AppHeader title="Acid Adjusting" />
      <Suspense>
        <AcidAdjustingCalculator defaultAcidity={1} />
      </Suspense>
      <Card m={1}>
        <CardContent>
          <Video id="dcw6IJSice4" />
        </CardContent>
      </Card>
      <TechniqueRecipes
        title="Acid-adjusted recipes"
        description="Every recipe that acid-adjusts one of its juices, alphabetically."
        recipes={recipes}
      />
    </>
  );
}
