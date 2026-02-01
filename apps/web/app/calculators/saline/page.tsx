import { Suspense } from 'react';
import AppHeader from '#/components/AppHeader';
import SalineCalculator from '#/components/SalineCalculator';

export default function SalineCalculatorPage() {
  return (
    <Suspense>
      <AppHeader title="Saline Solution Calculator" />
      <SalineCalculator sx={{ m: 1 }} />
    </Suspense>
  );
}
