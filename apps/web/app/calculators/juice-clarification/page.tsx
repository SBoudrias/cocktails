import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppHeader from '#/components/AppHeader';
import { InstructionSteps } from '#/components/calculators/InstructionSteps';
import JuiceClarificationCalculator from '#/components/calculators/JuiceClarificationCalculator';
import { Card, CardContent } from '#/components/ui/card';
import Video from '#/components/Video';

export const metadata: Metadata = {
  title: 'Indexotica | Juice Clarification Calculator',
};

export default function JuiceClarificationCalculatorPage() {
  return (
    <>
      <AppHeader title="Juice Clarification" />
      <Suspense>
        <JuiceClarificationCalculator />
      </Suspense>
      <Card m={1}>
        <CardContent>
          <InstructionSteps
            id="juice-clarification-instructions"
            steps={[
              'Stir the agar agar into the water and let it bloom for a couple of minutes.',
              'Heat the mixture gently until it boils to activate the agar agar.',
              'Transfer it to a heatproof container and let it cool to room temperature until fully set.',
              'Break the agar gel into smaller pieces.',
              'Blend the gel while slowly pouring in the raw juice.',
              'Pour the mixture into a drip filter lined with two coffee filters.',
              'Let the juice filter without disturbing the gel raft. The first liquid may be cloudy while the raft forms.',
            ]}
          />
        </CardContent>
      </Card>
      <Card m={1}>
        <CardContent>
          <p className="mb-4 text-sm">Juice clarification technique by Kate McGraw.</p>
          <Video id="_5iicQymdTU" start={193} />
        </CardContent>
      </Card>
    </>
  );
}
