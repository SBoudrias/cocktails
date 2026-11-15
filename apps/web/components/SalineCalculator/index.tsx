'use client';

import { Suspense, useState } from 'react';
import { Button } from '#/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card';
import { LabeledField } from '#/components/ui/labeled-field';

export default function SalineCalculator() {
  const [waterWeightValue, setWaterWeight] = useState<string | number>(80);
  const [salinityValue, setSalinity] = useState<string | number>(20);

  const waterWeight = Number(waterWeightValue);
  const salinity = Number(salinityValue);

  const isSalinityValid = !isNaN(salinity) && salinity > 0 && salinity < 100;
  const isWaterWeightValid = !isNaN(waterWeight) && waterWeight > 0;

  // Formula: S = (P/100 * W) / (1 - P/100)
  const saltWeight =
    isSalinityValid && isWaterWeightValid
      ? ((salinity / 100) * waterWeight) / (1 - salinity / 100)
      : NaN;

  return (
    <Suspense>
      <Card m={1}>
        <CardHeader>
          <CardTitle>Saline Solution Calculator</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* MUI's Stack was an unconditional row here (spacing 1 = 8px),
              the two fields stretching to equal height — alignItems:'top' in
              the sx was invalid CSS the browser ignored. */}
          <div className="flex flex-row gap-2">
            <LabeledField
              label="Water weight"
              unit="grams"
              value={waterWeightValue}
              type="number"
              onChange={(event) => {
                setWaterWeight(event.target.value);
              }}
              className="min-w-0 flex-1"
            />
            <LabeledField
              label="Target Salinity %"
              unit="%"
              value={salinityValue}
              type="number"
              onChange={(event) => {
                setSalinity(event.target.value);
              }}
              error={!isSalinityValid}
              helperText={!isSalinityValid ? 'Must be between 0 and 100' : undefined}
              className="min-w-0 flex-1"
            />
          </div>
          <LabeledField
            label="Salt to add"
            unit="grams"
            value={
              isNaN(saltWeight)
                ? ''
                : `${saltWeight.toLocaleString('en', { maximumFractionDigits: 2 })}`
            }
            readOnly
          />
          <div className="flex justify-end">
            <Button
              variant="text-secondary"
              onClick={() => {
                setWaterWeight('');
                setSalinity(20);
              }}
            >
              Reset to defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </Suspense>
  );
}
