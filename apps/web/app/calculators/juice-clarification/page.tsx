import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppHeader from '#/components/AppHeader';
import JuiceClarificationCalculator from '#/components/JuiceClarificationCalculator';

export const metadata: Metadata = {
  title: 'Cocktail Index | Juice Clarification Calculator',
};

export default function JuiceClarificationCalculatorPage() {
  return (
    <Suspense>
      <AppHeader title="Juice Clarification" />
      <JuiceClarificationCalculator sx={{ m: 1 }} />
    </Suspense>
  );
}
