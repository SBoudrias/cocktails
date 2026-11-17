import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppHeader from '#/components/AppHeader';
import AcidAdjustingCalculator from '#/components/calculators/AcidAdjustingCalculator';

export const metadata: Metadata = {
  title: 'Indexotica | Acid Adjusting',
};

export default async function CalculatorsPage() {
  return (
    <>
      <AppHeader title="Acid Adjusting" />
      <Suspense>
        <AcidAdjustingCalculator defaultAcidity={1} />
      </Suspense>
    </>
  );
}
