'use client';

import { parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import { match } from 'ts-pattern';
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
import { formatAmount } from '#/modules/formatAmount';
import {
  DEFAULT_CITRUS,
  type SuperJuiceCitrus,
  calculateSuperJuice,
  isSuperJuiceCitrus,
} from '#/modules/superJuice';

const DEFAULT_PEEL_WEIGHT = 100;

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
    </Card>
  );
}
