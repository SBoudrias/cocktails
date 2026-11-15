'use client';

import { Suspense, useState } from 'react';
import { Button } from '#/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card';
import { LabeledField } from '#/components/ui/labeled-field';

const DEFAULT_JUICE_WEIGHT = 100;

export default function BrixCalculator() {
  const [juiceWeightValue, setJuiceWeight] = useState<string | number>(
    DEFAULT_JUICE_WEIGHT,
  );
  const [currentBrixValue, setCurrentBrix] = useState<string | number>(0);
  const [targetBrixValue, setTargetBrix] = useState<string | number>(50);

  const juiceWeight = parseFloat(juiceWeightValue as string);
  const currentBrix = parseFloat(currentBrixValue as string) || 0;
  const targetBrix = parseFloat(targetBrixValue as string);

  const isTargetBrixValid = !isNaN(targetBrix) && targetBrix < 100;
  const isCurrentBrixValid =
    !isNaN(currentBrix) && currentBrix < targetBrix && currentBrix < 100;

  // Formula: sugar_weight = (juice_weight * (target_brix - current_brix)) / (100 - target_brix)
  const sugarWeight =
    isTargetBrixValid && isCurrentBrixValid
      ? (juiceWeight * (targetBrix - currentBrix)) / (100 - targetBrix)
      : NaN;

  return (
    <Suspense>
      <Card m={1}>
        <CardHeader>
          <CardTitle>Sugar Adjusting</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* MUI's Stack was an unconditional row here (unlike the other
              calculators' xs:column responsive rows) — cramped on phones,
              but that is what it drew. */}
          <div className="flex flex-row gap-2">
            <LabeledField
              label="Juice weight"
              unit="grams"
              value={juiceWeightValue}
              type="number"
              onChange={(event) => {
                setJuiceWeight(event.target.value);
              }}
              className="min-w-0 flex-1"
            />
            <LabeledField
              label="Juice Brix"
              unit="brix"
              value={currentBrixValue}
              type="number"
              onChange={(event) => {
                setCurrentBrix(event.target.value);
              }}
              error={!isCurrentBrixValid}
              helperText={
                !isCurrentBrixValid
                  ? currentBrix >= 100
                    ? 'Must be less than 100'
                    : 'Must be lower than target Brix'
                  : undefined
              }
              className="min-w-0 flex-1"
            />
            <LabeledField
              label="Target Brix"
              unit="brix"
              value={targetBrixValue}
              type="number"
              onChange={(event) => {
                setTargetBrix(event.target.value);
              }}
              error={!isTargetBrixValid}
              helperText={!isTargetBrixValid ? 'Must be less than 100' : undefined}
              className="min-w-0 flex-1"
            />
          </div>
          <LabeledField
            label="Sugar to add"
            unit="grams"
            value={
              isNaN(sugarWeight)
                ? ''
                : `${sugarWeight.toLocaleString('en', { maximumFractionDigits: 2 })}`
            }
            readOnly
          />
          <div className="flex justify-end">
            <Button
              variant="text-secondary"
              onClick={() => {
                setJuiceWeight(DEFAULT_JUICE_WEIGHT);
                setCurrentBrix(0);
                setTargetBrix(50);
              }}
            >
              Reset to defaults
            </Button>
          </div>
          {/* MUI's Stack spacing put 16px between every child; the sx mt:2
              on these notes overrode it (not added to it), so the gap is
              the parent's, with no extra margin. body2 metrics: 14px on a
              1.43 line box; the color stayed the foreground — MUI v9's
              Typography ignored the color="text.secondary" prop here. */}
          <p className="text-sm leading-[1.43]">
            Note: Use a refractometer to measure the current Brix level of your juice.
            Place a few drops of juice on the refractometer&apos;s prism, close the cover,
            and read the Brix value through the eyepiece.
          </p>
          <p className="text-sm leading-[1.43]">
            Degrees Brix (symbol °Bx) is a measure of the dissolved solids in a liquid. It
            is commonly used to measure dissolved sugar content of a solution. One degree
            Brix is 1 gram of sucrose solute dissolved in 100 grams of solution and
            represents the strength of the solution as percentage by mass.
          </p>
        </CardContent>
      </Card>
    </Suspense>
  );
}
