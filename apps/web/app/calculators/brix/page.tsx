import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppHeader from '#/components/AppHeader';
import BrixCalculator from '#/components/BrixCalculator';

export const metadata: Metadata = {
  title: 'Cocktail Index | Sugar Adjusting Calculator',
};

export default function BrixCalculatorPage() {
  return (
    <Suspense>
      <AppHeader title="Sugar Adjusting" />
      <BrixCalculator sx={{ m: 1 }} />
    </Suspense>
  );
}
