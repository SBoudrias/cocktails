import AppHeader from '@/components/AppHeader';
import BrixCalculator from '@/components/BrixCalculator';
import { Suspense } from 'react';

export default function BrixCalculatorPage() {
  return (
    <Suspense>
      <AppHeader title="Sugar Adjusting" />
      <BrixCalculator sx={{ m: 1 }} />
    </Suspense>
  );
}
