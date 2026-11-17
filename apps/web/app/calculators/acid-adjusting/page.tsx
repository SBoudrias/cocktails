import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppHeader from '#/components/AppHeader';
import AcidAdjustingCalculator from '#/components/calculators/AcidAdjustingCalculator';
import { Card, CardContent } from '#/components/ui/card';
import Video from '#/components/Video';

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
      <Card m={1}>
        <CardContent>
          <Video id="dcw6IJSice4" />
        </CardContent>
      </Card>
    </>
  );
}
