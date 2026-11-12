import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppHeader from '#/components/AppHeader';
import MilkClarificationCalculator from '#/components/MilkClarificationCalculator';

export const metadata: Metadata = {
  title: 'Indexotica | Milk Clarification Calculator',
};

export default function MilkClarificationCalculatorPage() {
  return (
    <>
      <AppHeader title="Milk Clarification" />
      <Suspense>
        <MilkClarificationCalculator sx={{ m: 1 }} />
      </Suspense>
    </>
  );
}
