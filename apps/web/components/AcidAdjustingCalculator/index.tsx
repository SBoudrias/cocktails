'use client';

import { cn } from 'cn';
import Link from 'next/link';
import { useQueryState } from 'nuqs';
import { useState } from 'react';
import { match } from 'ts-pattern';
import { Alert } from '#/components/ui/alert';
import { Button } from '#/components/ui/button';
import { buttonVariants } from '#/components/ui/button-variants';
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card';
import { LabeledField } from '#/components/ui/labeled-field';
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group';
import Video from '#/components/Video';

const DEFAULT_TARGET_ACIDITY = 6;
const DEFAULT_SOLUTION_VOLUME = 100;

type AcidProfile = 'lime' | 'lemon';

function parseNumber(value: string) {
  return Number.parseFloat(value);
}

function formatNumber(value: number) {
  return Number.isFinite(value)
    ? value.toLocaleString('en', { maximumFractionDigits: 2 })
    : '';
}

function AcidProfileSelector({
  profile,
  onChange,
}: {
  profile: AcidProfile;
  onChange: (profile: AcidProfile) => void;
}) {
  return (
    <ToggleGroup
      value={profile}
      onChange={onChange}
      aria-label="Target acid profile"
      fullWidth
    >
      <ToggleGroupItem value="lime">Lime</ToggleGroupItem>
      <ToggleGroupItem value="lemon">Lemon</ToggleGroupItem>
    </ToggleGroup>
  );
}

function PowderCalculator({
  defaultAcidity,
  profile,
  onProfileChange,
  showFullCalculatorLink,
}: {
  defaultAcidity: number;
  profile: AcidProfile;
  onProfileChange: (profile: AcidProfile) => void;
  showFullCalculatorLink: boolean;
}) {
  const [targetAcidityValue, setTargetAcidity] = useState(() =>
    DEFAULT_TARGET_ACIDITY.toString(),
  );
  const [acidAmountValue, setAcidAmount] = useState(() => defaultAcidity.toString());
  const [weightValue, setWeight] = useState('100');

  const targetAcidity = parseNumber(targetAcidityValue);
  const acidAmount = parseNumber(acidAmountValue);
  const weight = parseNumber(weightValue);
  const acidPercentages = match(profile)
    .with('lime', () => ({
      citric: targetAcidity * (2 / 3) - acidAmount,
      malic: targetAcidity * (1 / 3),
    }))
    .with('lemon', () => ({
      citric: targetAcidity - acidAmount,
      malic: 0,
    }))
    .exhaustive();

  const isWeightValid = Number.isFinite(weight) && weight > 0;
  const isAcidAmountValid = Number.isFinite(acidAmount) && acidAmount >= 0;
  const isTargetAcidityValid =
    Number.isFinite(targetAcidity) && targetAcidity > acidAmount;
  const isProfilePossible = !isTargetAcidityValid || acidPercentages.citric >= 0;
  const isAdjustmentValid =
    isWeightValid && isAcidAmountValid && isTargetAcidityValid && isProfilePossible;

  const citricAcid = isAdjustmentValid
    ? (acidPercentages.citric * weight) / 100
    : Number.NaN;
  const malicAcid = isAdjustmentValid
    ? (acidPercentages.malic * weight) / 100
    : Number.NaN;

  return (
    <CardContent className="flex flex-col gap-4">
      <AcidProfileSelector profile={profile} onChange={onProfileChange} />
      <div className="flex flex-col gap-2 min-[600px]:flex-row min-[600px]:items-center">
        <LabeledField
          label="Juice weight"
          unit="grams"
          value={weightValue}
          type="number"
          onChange={(event) => {
            setWeight(event.target.value);
          }}
          error={!isWeightValid}
          helperText={!isWeightValid ? 'Must be greater than zero' : undefined}
          className="min-w-0 flex-1"
        />
        <LabeledField
          label="Juice acidity"
          unit="%"
          value={acidAmountValue}
          type="number"
          onChange={(event) => {
            setAcidAmount(event.target.value);
          }}
          error={!isAcidAmountValid}
          helperText={!isAcidAmountValid ? 'Must be zero or greater' : undefined}
          className="min-w-0 flex-1"
        />
        <LabeledField
          label="Target acidity"
          unit="%"
          value={targetAcidityValue}
          type="number"
          onChange={(event) => {
            setTargetAcidity(event.target.value);
          }}
          error={!isTargetAcidityValid}
          helperText={
            !isTargetAcidityValid ? 'Must be greater than juice acidity' : undefined
          }
          className="min-w-0 flex-1"
        />
      </div>
      {!isProfilePossible && (
        <Alert severity="error">
          The juice already contains too much citric acid to reach the selected Lime
          profile by adding acid.
        </Alert>
      )}
      <p className="text-base">Mix and dilute into the juice:</p>
      <LabeledField
        label="Citric acid"
        unit="grams"
        value={formatNumber(citricAcid)}
        readOnly
      />
      {match(profile)
        .with('lime', () => (
          <LabeledField
            label="Malic acid"
            unit="grams"
            value={formatNumber(malicAcid)}
            readOnly
          />
        ))
        .with('lemon', () => null)
        .exhaustive()}
      <div
        className={cn(
          'flex gap-2',
          showFullCalculatorLink ? 'justify-between' : 'justify-end',
        )}
        role="group"
        aria-label="Powder adjustment actions"
      >
        {showFullCalculatorLink && <FullCalculatorLink />}
        <Button
          variant="text-secondary"
          onClick={() => {
            setTargetAcidity(DEFAULT_TARGET_ACIDITY.toString());
            setAcidAmount(defaultAcidity.toString());
            setWeight('100');
          }}
          aria-label="Reset powder adjustment to defaults"
        >
          Reset to defaults
        </Button>
      </div>
    </CardContent>
  );
}

function SolutionRecipe({
  profile,
  onProfileChange,
  solutionVolumeValue,
  onSolutionVolumeChange,
}: {
  profile: AcidProfile;
  onProfileChange: (profile: AcidProfile) => void;
  solutionVolumeValue: string;
  onSolutionVolumeChange: (value: string) => void;
}) {
  const solutionVolume = parseNumber(solutionVolumeValue);
  const isSolutionVolumeValid = Number.isFinite(solutionVolume) && solutionVolume > 0;
  const scale = isSolutionVolumeValid
    ? solutionVolume / DEFAULT_SOLUTION_VOLUME
    : Number.NaN;
  const recipe = match(profile)
    .with('lime', () => ({
      citricAcid: 24 * scale,
      malicAcid: 11 * scale,
      approximateWater: 78 * scale,
    }))
    .with('lemon', () => ({
      citricAcid: 35 * scale,
      malicAcid: null,
      approximateWater: null,
    }))
    .exhaustive();

  return (
    <section aria-labelledby="make-acid-solution-heading" className="flex flex-col gap-4">
      {/* The section heading, rendered as an h3: 20px/500/32px. */}
      <h3 id="make-acid-solution-heading" className="text-xl leading-8 font-medium">
        Make the solution
      </h3>
      <AcidProfileSelector profile={profile} onChange={onProfileChange} />
      <p className="text-sm">
        The “1%” name describes its dosing: 1 ml added to 1 oz of juice raises acidity by
        1 percentage point.
      </p>
      <LabeledField
        label="Bottle size"
        unit="ml"
        value={solutionVolumeValue}
        type="number"
        onChange={(event) => {
          onSolutionVolumeChange(event.target.value);
        }}
        error={!isSolutionVolumeValid}
        helperText={!isSolutionVolumeValid ? 'Must be greater than zero' : undefined}
      />
      <LabeledField
        label="Citric acid for solution"
        unit="grams"
        value={formatNumber(recipe.citricAcid)}
        readOnly
      />
      {match(recipe.malicAcid)
        .with(null, () => null)
        .otherwise((malicAcid) => (
          <LabeledField
            label="Malic acid for solution"
            unit="grams"
            value={formatNumber(malicAcid)}
            readOnly
          />
        ))}
      {match(recipe.approximateWater)
        .with(null, () => null)
        .otherwise((approximateWater) => (
          <LabeledField
            label="Approximate water"
            unit="grams"
            value={formatNumber(approximateWater)}
            readOnly
          />
        ))}
      {isSolutionVolumeValid && (
        <p className="text-base">
          Dissolve the acids in some water, then add enough water to reach{' '}
          {formatNumber(solutionVolume)} ml total volume.
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          variant="text-secondary"
          onClick={() => {
            onSolutionVolumeChange(DEFAULT_SOLUTION_VOLUME.toString());
          }}
          aria-label="Reset solution recipe to defaults"
        >
          Reset to defaults
        </Button>
      </div>
    </section>
  );
}

function SolutionCalculator({
  defaultAcidity,
  profile,
  onProfileChange,
  showDetails,
  showFullCalculatorLink,
}: {
  defaultAcidity: number;
  profile: AcidProfile;
  onProfileChange: (profile: AcidProfile) => void;
  showDetails: boolean;
  showFullCalculatorLink: boolean;
}) {
  const [juiceAmountValue, setJuiceAmount] = useQueryState('juiceAmount', {
    defaultValue: '1',
  });
  const [initialJuiceAmount] = useState(juiceAmountValue);
  const [targetAcidityValue, setTargetAcidity] = useState(() =>
    DEFAULT_TARGET_ACIDITY.toString(),
  );
  const [acidAmountValue, setAcidAmount] = useState(() => defaultAcidity.toString());
  const [solutionVolumeValue, setSolutionVolume] = useState(() =>
    DEFAULT_SOLUTION_VOLUME.toString(),
  );

  const juiceAmount = parseNumber(juiceAmountValue);
  const targetAcidity = parseNumber(targetAcidityValue);
  const acidAmount = parseNumber(acidAmountValue);
  const isJuiceAmountValid = Number.isFinite(juiceAmount) && juiceAmount > 0;
  const isAcidAmountValid = Number.isFinite(acidAmount) && acidAmount >= 0;
  const isTargetAcidityValid =
    Number.isFinite(targetAcidity) && targetAcidity > acidAmount;
  const solutionAmount =
    isJuiceAmountValid && isAcidAmountValid && isTargetAcidityValid
      ? juiceAmount * (targetAcidity - acidAmount)
      : Number.NaN;

  return (
    <>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 min-[600px]:flex-row min-[600px]:items-center">
          <LabeledField
            label="Juice amount"
            unit="oz"
            value={juiceAmountValue}
            type="number"
            onChange={(event) => {
              setJuiceAmount(event.target.value);
            }}
            error={!isJuiceAmountValid}
            helperText={!isJuiceAmountValid ? 'Must be greater than zero' : undefined}
            className="min-w-0 flex-1"
          />
          <LabeledField
            label="Juice acidity"
            unit="%"
            value={acidAmountValue}
            type="number"
            onChange={(event) => {
              setAcidAmount(event.target.value);
            }}
            error={!isAcidAmountValid}
            helperText={!isAcidAmountValid ? 'Must be zero or greater' : undefined}
            className="min-w-0 flex-1"
          />
          <LabeledField
            label="Target acidity"
            unit="%"
            value={targetAcidityValue}
            type="number"
            onChange={(event) => {
              setTargetAcidity(event.target.value);
            }}
            error={!isTargetAcidityValid}
            helperText={
              !isTargetAcidityValid ? 'Must be greater than juice acidity' : undefined
            }
            className="min-w-0 flex-1"
          />
        </div>
        <LabeledField
          label="Acid solution to add"
          unit="ml"
          value={formatNumber(solutionAmount)}
          readOnly
        />
        <div
          className={cn(
            'flex gap-2',
            showFullCalculatorLink ? 'justify-between' : 'justify-end',
          )}
          role="group"
          aria-label="Solution adjustment actions"
        >
          {showFullCalculatorLink && <FullCalculatorLink />}
          <Button
            variant="text-secondary"
            onClick={() => {
              setJuiceAmount(initialJuiceAmount);
              setTargetAcidity(DEFAULT_TARGET_ACIDITY.toString());
              setAcidAmount(defaultAcidity.toString());
            }}
            aria-label="Reset juice adjustment to defaults"
          >
            Reset to defaults
          </Button>
        </div>
      </CardContent>
      {showDetails && (
        <>
          <CardContent>
            <SolutionRecipe
              profile={profile}
              onProfileChange={onProfileChange}
              solutionVolumeValue={solutionVolumeValue}
              onSolutionVolumeChange={setSolutionVolume}
            />
          </CardContent>
          <CardContent>
            <Video id="dcw6IJSice4" />
          </CardContent>
        </>
      )}
    </>
  );
}

// A text button shape rendered on the link itself.
function FullCalculatorLink() {
  const [juiceAmount] = useQueryState('juiceAmount', { defaultValue: '1' });

  return (
    <Link
      href={{
        pathname: '/calculators/acid-adjusting',
        query: { juiceAmount },
      }}
      className={buttonVariants({ variant: 'text' })}
    >
      Full calculator
    </Link>
  );
}

export default function AcidAdjustingCalculator({
  defaultAcidity,
  compact = false,
}: {
  defaultAcidity: number;
  compact?: boolean;
}) {
  const [type, setType] = useState<'powder' | 'solution'>('solution');
  const [profile, setProfile] = useState<AcidProfile>('lime');

  return (
    <Card m={1}>
      {/* The header's action slot (24px bottom padding): the slot is flex
          0 0 auto, aligned to the start, pulled into the header's 16px
          padding by its -4/-8/-4 margins. */}
      <CardHeader className="flex-row items-center pb-6">
        <CardTitle className="min-w-0 flex-1">Acid Adjusting</CardTitle>
        <div className="-mt-1 -mr-2 -mb-1 shrink-0 self-start">
          <ToggleGroup
            value={type}
            onChange={setType}
            aria-label="Preferred acid-adjusting technique"
          >
            <ToggleGroupItem value="solution">Solution</ToggleGroupItem>
            <ToggleGroupItem value="powder">Powder</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      {match(type)
        .with('powder', () => (
          <PowderCalculator
            defaultAcidity={defaultAcidity}
            profile={profile}
            onProfileChange={setProfile}
            showFullCalculatorLink={compact}
          />
        ))
        .with('solution', () => (
          <SolutionCalculator
            defaultAcidity={defaultAcidity}
            profile={profile}
            onProfileChange={setProfile}
            showDetails={!compact}
            showFullCalculatorLink={compact}
          />
        ))
        .exhaustive()}
    </Card>
  );
}
