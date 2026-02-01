import type { Metadata } from 'next';
import { Suspense } from 'react';
import AcidAdjustingCalculator from '#/components/AcidAdjustingCalculator';
import AppHeader from '#/components/AppHeader';

export const metadata: Metadata = {
  title: 'Cocktail Index | Acid Adjusting',
};

export default async function CalculatorsPage() {
  return (
    <Suspense>
      <AppHeader title="Acid Adjusting" />
      <AcidAdjustingCalculator defaultAcidity={1} sx={{ m: 1 }} />
    </Suspense>
  );
}
