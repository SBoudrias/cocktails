'use client';

import { tryConvertVolume } from '@cocktails/conversion';
import type { RecipeIngredient } from '@cocktails/data';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { match } from 'ts-pattern';
import { Button } from '#/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card';
import { LabeledField } from '#/components/ui/labeled-field';
import Video from '#/components/Video';
import { formatAmount } from '#/modules/formatAmount';

const DEFAULT_JUICE_WEIGHT = 250;
const MINIMUM_CONTEXTUAL_JUICE_WEIGHT = DEFAULT_JUICE_WEIGHT;
const WATER_RATIO = 0.3;
const AGAR_RATIO = 0.003;

function getDefaultJuiceWeight(searchParams: Pick<URLSearchParams, 'get'>) {
  const amount = Number(searchParams.get('amount'));
  if (!Number.isFinite(amount) || amount <= 0) {
    return DEFAULT_JUICE_WEIGHT;
  }

  const quantity = match(searchParams.get('unit'))
    .returnType<RecipeIngredient['quantity'] | undefined>()
    .with('gram', 'ml', 'oz', 'tsp', 'tbsp', 'cup', (unit) => ({ amount, unit }))
    .otherwise(() => undefined);
  if (quantity === undefined) {
    return DEFAULT_JUICE_WEIGHT;
  }

  const approximateWeight = match(quantity)
    .with({ unit: 'gram' }, ({ amount }) => amount)
    .otherwise(
      (volumeQuantity) =>
        tryConvertVolume(volumeQuantity, 'ml')?.amount ?? DEFAULT_JUICE_WEIGHT,
    );

  return Math.max(approximateWeight, MINIMUM_CONTEXTUAL_JUICE_WEIGHT);
}

export default function JuiceClarificationCalculator() {
  const searchParams = useSearchParams();
  const [defaultJuiceWeight] = useState(() => getDefaultJuiceWeight(searchParams));
  const [juiceWeightValue, setJuiceWeight] = useState<string | number>(
    defaultJuiceWeight,
  );

  const juiceWeight = Number(juiceWeightValue);
  const isJuiceWeightValid = Number.isFinite(juiceWeight) && juiceWeight > 0;
  const waterWeight = isJuiceWeightValid ? juiceWeight * WATER_RATIO : NaN;
  const agarWeight = isJuiceWeightValid ? juiceWeight * AGAR_RATIO : NaN;

  return (
    <Card m={1}>
      <CardHeader>
        <CardTitle>Juice Clarification</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <LabeledField
          label="Raw juice weight"
          unit="grams"
          value={juiceWeightValue}
          type="number"
          onChange={(event) => {
            setJuiceWeight(event.target.value);
          }}
          error={!isJuiceWeightValid}
          helperText={!isJuiceWeightValid ? 'Must be greater than 0' : undefined}
          min={0}
          step="any"
        />
        <div className="flex flex-col gap-2 min-[600px]:flex-row">
          <LabeledField
            label="Water"
            unit="grams"
            value={isNaN(waterWeight) ? '' : formatAmount(waterWeight, 2)}
            readOnly
            className="min-w-0 flex-1"
          />
          <LabeledField
            label="Agar agar"
            unit="grams"
            value={isNaN(agarWeight) ? '' : formatAmount(agarWeight, 3)}
            readOnly
            className="min-w-0 flex-1"
          />
        </div>
        <div className="flex justify-end">
          <Button
            variant="text-secondary"
            onClick={() => {
              setJuiceWeight(defaultJuiceWeight);
            }}
          >
            Reset to defaults
          </Button>
        </div>
      </CardContent>
      <CardContent>
        {/* MUI's Typography variant=h6 with gutterBottom: 20px/500/32px and
            the 0.35em (7px) bottom margin. A div like MUI rendered (no
            heading semantics were added). */}
        <div
          id="juice-clarification-instructions"
          className="mb-[7px] text-xl leading-8 font-medium"
        >
          Instructions
        </div>
        {/* The app's base layer strips list markers (probed on the baseline:
            MUI's CssBaseline never restored them, so no step numbers show).
            Metrics are MUI's Box pl: 3 (24px indent) with body1 rows. */}
        <ol aria-labelledby="juice-clarification-instructions" className="pl-6">
          <li className="text-base">
            Stir the agar agar into the water and let it bloom for a couple of minutes.
          </li>
          <li className="text-base">
            Heat the mixture gently until it boils to activate the agar agar.
          </li>
          <li className="text-base">
            Transfer it to a heatproof container and let it cool to room temperature until
            fully set.
          </li>
          <li className="text-base">Break the agar gel into smaller pieces.</li>
          <li className="text-base">
            Blend the gel while slowly pouring in the raw juice.
          </li>
          <li className="text-base">
            Pour the mixture into a drip filter lined with two coffee filters.
          </li>
          <li className="text-base">
            Let the juice filter without disturbing the gel raft. The first liquid may be
            cloudy while the raft forms.
          </li>
        </ol>
      </CardContent>
      <CardContent>
        <p className="mb-4 text-sm">Juice clarification technique by Kate McGraw.</p>
        <Video id="_5iicQymdTU" start={193} />
      </CardContent>
    </Card>
  );
}
