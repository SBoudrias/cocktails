import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppHeader from '#/components/AppHeader';
import JuiceClarificationCalculator from '#/components/JuiceClarificationCalculator';

export const metadata: Metadata = {
  title: 'Indexotica | Juice Clarification Calculator',
};

export default function JuiceClarificationCalculatorPage() {
  return (
    <>
      <AppHeader title="Juice Clarification" />
      <Suspense>
        <JuiceClarificationCalculator sx={{ m: 1 }} />
      </Suspense>
    </>
  );
}
