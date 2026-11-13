import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppHeader from '#/components/AppHeader';
import SuperJuiceCalculator from '#/components/SuperJuiceCalculator';

export const metadata: Metadata = {
  title: 'Indexotica | Super Juice Calculator',
};

export default function SuperJuiceCalculatorPage() {
  return (
    <>
      <AppHeader title="Super Juice" />
      <Suspense>
        <SuperJuiceCalculator sx={{ m: 1 }} />
      </Suspense>
    </>
  );
}
