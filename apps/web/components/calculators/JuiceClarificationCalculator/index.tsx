'use client';

import { tryConvertVolume } from '@cocktails/conversion';
import type { RecipeIngredient } from '@cocktails/data';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { match } from 'ts-pattern';
import { Button } from '#/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card';
import { LabeledField } from '#/components/ui/labeled-field';
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
  const waterWeight = isJuiceWeightValid ? juiceWeight * WATER_RATIO : Number.NaN;
  const agarWeight = isJuiceWeightValid ? juiceWeight * AGAR_RATIO : Number.NaN;

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
            value={Number.isNaN(waterWeight) ? '' : formatAmount(waterWeight, 2)}
            readOnly
            className="min-w-0 flex-1"
          />
          <LabeledField
            label="Agar agar"
            unit="grams"
            value={Number.isNaN(agarWeight) ? '' : formatAmount(agarWeight, 3)}
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
    </Card>
  );
}
