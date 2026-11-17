'use client';

import { parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import { match } from 'ts-pattern';
import { InstructionSteps } from '#/components/calculators/InstructionSteps';
import { Button } from '#/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardSubheader,
  CardTitle,
} from '#/components/ui/card';
import { LabeledField } from '#/components/ui/labeled-field';
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group';
import Video from '#/components/Video';
import { formatAmount } from '#/modules/formatAmount';
import { type SuperJuiceCitrus, calculateSuperJuice } from '#/modules/superJuice';

const DEFAULT_PEEL_WEIGHT = 100;
const DEFAULT_CITRUS: SuperJuiceCitrus = 'lime';

const isSuperJuiceCitrus = (value: string | null): value is SuperJuiceCitrus =>
  value != null &&
  match(value)
    .with('lemon', 'lime', 'orange', 'grapefruit', 'kumquat', () => true)
    .otherwise(() => false);

const CITRUS_INPUT_LABELS: Record<SuperJuiceCitrus, string> = {
  lemon: 'Lemon peel weight',
  lime: 'Lime peel weight',
  orange: 'Orange peel weight',
  grapefruit: 'Grapefruit peel weight',
  kumquat: 'Kumquat weight',
};

function CitrusSelector({
  citrus,
  onChange,
}: {
  citrus: SuperJuiceCitrus;
  onChange: (citrus: SuperJuiceCitrus) => void;
}) {
  return (
    <ToggleGroup value={citrus} onChange={onChange} aria-label="Citrus type" fullWidth>
      <ToggleGroupItem value="lemon">Lemon</ToggleGroupItem>
      <ToggleGroupItem value="lime">Lime</ToggleGroupItem>
      <ToggleGroupItem value="orange">Orange</ToggleGroupItem>
      <ToggleGroupItem value="grapefruit">Grapefruit</ToggleGroupItem>
      <ToggleGroupItem value="kumquat">Kumquat</ToggleGroupItem>
    </ToggleGroup>
  );
}

function ResultField({ label, value }: { label: string; value: string }) {
  return <LabeledField label={label} unit="grams" value={value} readOnly />;
}

function formatGrams(value: number, fractionDigits = 2) {
  return Number.isFinite(value) ? formatAmount(value, fractionDigits) : '';
}

export default function SuperJuiceCalculator() {
  const [citrusParam, setCitrus] = useQueryState('citrus', parseAsString);
  const citrus = isSuperJuiceCitrus(citrusParam) ? citrusParam : DEFAULT_CITRUS;
  const [inputWeightValue, setInputWeight] = useState<string | number>(
    DEFAULT_PEEL_WEIGHT,
  );

  const inputWeight = Number(inputWeightValue);
  const isInputWeightValid = Number.isFinite(inputWeight) && inputWeight > 0;
  const showsMalic = match(citrus)
    .with('lime', 'orange', 'grapefruit', () => true)
    .otherwise(() => false);
  const showsMsg = citrus === 'grapefruit';

  const superJuice = calculateSuperJuice({ citrus, inputWeight });

  // Whole-fruit kumquats get their own procedure (Kevin Kos's kumquat recipe);
  // every other citrus is peeled and measured by peel weight.
  const instructions = match(citrus)
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
      <CardHeader>
        <CardTitle>Super Juice</CardTitle>
        {/* CardHeader subheader: body2 metrics, inheriting the
            foreground. */}
        <CardSubheader className="text-sm text-foreground">
          Acid-adjusted, peel-oleated citrus juice. Technique by Nickle Morris; ratios
          after Kevin Kos’s published recipes.
        </CardSubheader>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <CitrusSelector citrus={citrus} onChange={setCitrus} />
        <LabeledField
          label={CITRUS_INPUT_LABELS[citrus]}
          unit="grams"
          value={inputWeightValue}
          type="number"
          onChange={(event) => {
            setInputWeight(event.target.value);
          }}
          error={!isInputWeightValid}
          helperText={!isInputWeightValid ? 'Must be greater than 0' : undefined}
          min={0}
          step="any"
        />
        <ResultField label="Citric acid" value={formatGrams(superJuice.citricAcid)} />
        {showsMalic && (
          <ResultField label="Malic acid" value={formatGrams(superJuice.malicAcid)} />
        )}
        {showsMsg && <ResultField label="MSG" value={formatGrams(superJuice.msg)} />}
        <ResultField label="Water" value={formatGrams(superJuice.water)} />
        <div
          className="flex justify-end"
          role="group"
          aria-label="Super juice calculator actions"
        >
          <Button
            variant="text-secondary"
            onClick={() => {
              setInputWeight(DEFAULT_PEEL_WEIGHT);
            }}
          >
            Reset to defaults
          </Button>
        </div>
      </CardContent>
      <CardContent>
        <InstructionSteps id="super-juice-instructions" steps={instructions} />
      </CardContent>
      <CardContent>
        <Video id="2RA3AaCO7A8" start={313} />
      </CardContent>
    </Card>
  );
}
