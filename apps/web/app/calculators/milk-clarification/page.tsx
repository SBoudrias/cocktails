import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppHeader from '#/components/AppHeader';
import MilkClarificationCalculator from '#/components/MilkClarificationCalculator';

export const metadata: Metadata = {
  title: 'Cocktail Index | Milk Clarification Calculator',
};

export default function MilkClarificationCalculatorPage() {
  return (
    <Suspense>
      <AppHeader title="Milk Clarification" />
      <MilkClarificationCalculator sx={{ m: 1 }} />
    </Suspense>
  );
}
