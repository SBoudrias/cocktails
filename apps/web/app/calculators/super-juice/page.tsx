import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppHeader from '#/components/AppHeader';
import SuperJuiceCalculator from '#/components/calculators/SuperJuiceCalculator';
import SuperJuiceInstructions from '#/components/calculators/SuperJuiceCalculator/Instructions';
import { Card, CardContent } from '#/components/ui/card';
import Video from '#/components/Video';

export const metadata: Metadata = {
  title: 'Indexotica | Super Juice Calculator',
};

export default function SuperJuiceCalculatorPage() {
  return (
    <>
      <AppHeader title="Super Juice" />
      <Suspense>
        <SuperJuiceCalculator />
      </Suspense>
      <Suspense>
        <SuperJuiceInstructions />
      </Suspense>
      <Card m={1}>
        <CardContent>
          <Video id="2RA3AaCO7A8" start={313} />
        </CardContent>
      </Card>
    </>
  );
}
