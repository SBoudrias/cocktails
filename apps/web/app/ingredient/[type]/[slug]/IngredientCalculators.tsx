'use client';

import type { RootIngredient } from '@cocktails/data';
import { parseAsNativeArrayOf, parseAsString, useQueryState } from 'nuqs';
import AcidAdjustingCalculator from '#/components/AcidAdjustingCalculator';
import JuiceClarificationCalculator from '#/components/JuiceClarificationCalculator';

const AGAR_CLARIFICATION_TECHNIQUES = [
  'clarification',
  'clarification:agar',
  'clarification:agar-agar',
];

export default function IngredientCalculators({
  ingredient,
}: {
  ingredient: RootIngredient;
}) {
  const [techniques] = useQueryState('technique', parseAsNativeArrayOf(parseAsString));
  if (ingredient.type !== 'juice') {
    return null;
  }

  return (
    <>
      {techniques.includes('acid-adjustment') &&
        'acidity' in ingredient &&
        ingredient.acidity != null && (
          <AcidAdjustingCalculator
            defaultAcidity={ingredient.acidity}
            sx={{ m: 1 }}
            compact
          />
        )}
      {techniques.some((technique) =>
        AGAR_CLARIFICATION_TECHNIQUES.includes(technique),
      ) && <JuiceClarificationCalculator sx={{ m: 1 }} />}
    </>
  );
}
