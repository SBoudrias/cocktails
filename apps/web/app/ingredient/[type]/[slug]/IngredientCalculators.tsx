'use client';

import type { RootIngredient } from '@cocktails/data';
import { parseAsNativeArrayOf, parseAsString, useQueryState } from 'nuqs';
import AcidAdjustingCalculator from '#/components/calculators/AcidAdjustingCalculator';
import JuiceClarificationCalculator from '#/components/calculators/JuiceClarificationCalculator';

const AGAR_CLARIFICATION_TECHNIQUES = [
  'clarification',
  'clarification:agar',
  'clarification:agar-agar',
];

export default function IngredientCalculators({
  ingredient,
}: {
  ingredient: { type: RootIngredient['type']; acidity?: number };
}) {
  const [techniques] = useQueryState('technique', parseAsNativeArrayOf(parseAsString));
  if (ingredient.type !== 'juice') {
    return null;
  }

  return (
    <>
      {techniques.includes('acid-adjustment') && ingredient.acidity != null && (
        <AcidAdjustingCalculator defaultAcidity={ingredient.acidity} compact />
      )}
      {techniques.some((technique) =>
        AGAR_CLARIFICATION_TECHNIQUES.includes(technique),
      ) && <JuiceClarificationCalculator />}
    </>
  );
}
