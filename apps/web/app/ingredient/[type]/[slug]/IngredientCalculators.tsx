'use client';

import type { RootIngredient } from '@cocktails/data';
import { useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  if (ingredient.type !== 'juice') {
    return null;
  }

  const techniques = searchParams.getAll('technique');

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
