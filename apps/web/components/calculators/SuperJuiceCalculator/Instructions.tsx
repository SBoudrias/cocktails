'use client';

import { useQueryState, parseAsString } from 'nuqs';
import { match } from 'ts-pattern';
import { InstructionSteps } from '#/components/calculators/InstructionSteps';
import { Card, CardContent } from '#/components/ui/card';
import {
  DEFAULT_CITRUS,
  isSuperJuiceCitrus,
  type SuperJuiceCitrus,
} from '#/modules/superJuice';

/**
 * The super-juice instructions as their own card: a client component
 * because the steps depend on the citrus selection, but standalone — it
 * reads the same ?citrus= URL state the calculator writes, so the page
 * composes the cards (calculator, instructions, video) like the other
 * calculator pages, with no props threaded through the calculator.
 */
export default function SuperJuiceInstructions() {
  const [citrusParam] = useQueryState('citrus', parseAsString);
  const citrus: SuperJuiceCitrus = isSuperJuiceCitrus(citrusParam)
    ? citrusParam
    : DEFAULT_CITRUS;

  // Whole-fruit kumquats get their own procedure (Kevin Kos's kumquat recipe);
  // every other citrus is peeled and measured by peel weight.
  const steps = match(citrus)
    .with('kumquat', () => [
      'Weigh the kumquats whole — there is no need to peel fruit this small. The citric acid stands in for the missing peel weight (a quarter of the fruit).',
      'Muddle the kumquats with the citric acid and let the mix rest for about an hour; it will be very acidic and bursting with kumquat flavor.',
      'Add the water and blend long enough to pulverize every part of the fruit.',
      'Strain through a cloth filter and squeeze out all the juice. Optionally stir in ascorbic acid (vitamin C) at 0.04% of the strained weight to hold the aroma longer.',
      'Bottle and refrigerate; use within a week for peak flavor.',
    ])
    .otherwise(() => [
      'Peel the citrus and weigh the peels.',
      'Combine the peels with the calculated acids in a jar. Shake well and rest at room temperature for up to two hours to draw out the oils into an oleo citrate.',
      'Transfer everything to a blender, add the water (rinse the jar with it to carry over every last bit of oleo citrate) and the fresh juice.',
      'Blend for about half a minute, then strain through a cheesecloth.',
      'Bottle and refrigerate; use within a week for peak flavor.',
    ]);

  return (
    <Card m={1}>
      <CardContent>
        <InstructionSteps id="super-juice-instructions" steps={steps} />
      </CardContent>
    </Card>
  );
}
