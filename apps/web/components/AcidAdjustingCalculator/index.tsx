'use client';

import type { SxProps } from '@mui/material';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useQueryState } from 'nuqs';
import { useState } from 'react';
import { match } from 'ts-pattern';
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
    <ToggleButtonGroup
      value={profile}
      onChange={(_, value: unknown) =>
        match(value)
          .with('lime', () => onChange('lime'))
          .with('lemon', () => onChange('lemon'))
          .otherwise(() => undefined)
      }
      size="small"
      aria-label="Target acid profile"
      exclusive
      fullWidth
    >
      <ToggleButton value="lime">Lime</ToggleButton>
      <ToggleButton value="lemon">Lemon</ToggleButton>
    </ToggleButtonGroup>
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
    <CardContent>
      <Stack spacing={2}>
        <AcidProfileSelector profile={profile} onChange={onProfileChange} />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ alignItems: 'center' }}
        >
          <TextField
            label="Juice weight"
            value={weightValue}
            type="number"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setWeight(event.target.value);
            }}
            error={!isWeightValid}
            helperText={!isWeightValid ? 'Must be greater than zero' : ''}
            fullWidth
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">grams</InputAdornment>,
              },
            }}
          />
          <TextField
            label="Juice acidity"
            value={acidAmountValue}
            type="number"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setAcidAmount(event.target.value);
            }}
            error={!isAcidAmountValid}
            helperText={!isAcidAmountValid ? 'Must be zero or greater' : ''}
            fullWidth
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              },
            }}
          />
          <TextField
            label="Target acidity"
            value={targetAcidityValue}
            type="number"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setTargetAcidity(event.target.value);
            }}
            error={!isTargetAcidityValid}
            helperText={!isTargetAcidityValid ? 'Must be greater than juice acidity' : ''}
            fullWidth
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              },
            }}
          />
        </Stack>
        {!isProfilePossible && (
          <Alert severity="error">
            The juice already contains too much citric acid to reach the selected Lime
            profile by adding acid.
          </Alert>
        )}
        <Typography>Mix and dilute into the juice:</Typography>
        <TextField
          label="Citric acid"
          value={formatNumber(citricAcid)}
          fullWidth
          slotProps={{
            input: {
              readOnly: true,
              endAdornment: <InputAdornment position="end">grams</InputAdornment>,
            },
          }}
        />
        {match(profile)
          .with('lime', () => (
            <TextField
              label="Malic acid"
              value={formatNumber(malicAcid)}
              fullWidth
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: <InputAdornment position="end">grams</InputAdornment>,
                },
              }}
            />
          ))
          .with('lemon', () => null)
          .exhaustive()}
        <Stack
          direction="row"
          role="group"
          aria-label="Powder adjustment actions"
          spacing={1}
          sx={{
            justifyContent: showFullCalculatorLink ? 'space-between' : 'flex-end',
          }}
        >
          {showFullCalculatorLink && <FullCalculatorLink />}
          <Button
            color="secondary"
            onClick={() => {
              setTargetAcidity(DEFAULT_TARGET_ACIDITY.toString());
              setAcidAmount(defaultAcidity.toString());
              setWeight('100');
            }}
            aria-label="Reset powder adjustment to defaults"
          >
            Reset to defaults
          </Button>
        </Stack>
      </Stack>
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
    <Stack component="section" aria-labelledby="make-acid-solution-heading" spacing={2}>
      <Typography id="make-acid-solution-heading" component="h3" variant="h6">
        Make the solution
      </Typography>
      <AcidProfileSelector profile={profile} onChange={onProfileChange} />
      <Typography variant="body2" color="text.secondary">
        The “1%” name describes its dosing: 1 ml added to 1 oz of juice raises acidity by
        1 percentage point.
      </Typography>
      <TextField
        label="Bottle size"
        value={solutionVolumeValue}
        type="number"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          onSolutionVolumeChange(event.target.value);
        }}
        error={!isSolutionVolumeValid}
        helperText={!isSolutionVolumeValid ? 'Must be greater than zero' : undefined}
        fullWidth
        slotProps={{
          input: {
            endAdornment: <InputAdornment position="end">ml</InputAdornment>,
          },
        }}
      />
      <TextField
        label="Citric acid for solution"
        value={formatNumber(recipe.citricAcid)}
        fullWidth
        slotProps={{
          input: {
            readOnly: true,
            endAdornment: <InputAdornment position="end">grams</InputAdornment>,
          },
        }}
      />
      {match(recipe.malicAcid)
        .with(null, () => null)
        .otherwise((malicAcid) => (
          <TextField
            label="Malic acid for solution"
            value={formatNumber(malicAcid)}
            fullWidth
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: <InputAdornment position="end">grams</InputAdornment>,
              },
            }}
          />
        ))}
      {match(recipe.approximateWater)
        .with(null, () => null)
        .otherwise((approximateWater) => (
          <TextField
            label="Approximate water"
            value={formatNumber(approximateWater)}
            fullWidth
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: <InputAdornment position="end">grams</InputAdornment>,
              },
            }}
          />
        ))}
      {isSolutionVolumeValid && (
        <Typography>
          Dissolve the acids in some water, then add enough water to reach{' '}
          {formatNumber(solutionVolume)} ml total volume.
        </Typography>
      )}
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
        <Button
          color="secondary"
          onClick={() => {
            onSolutionVolumeChange(DEFAULT_SOLUTION_VOLUME.toString());
          }}
          aria-label="Reset solution recipe to defaults"
        >
          Reset to defaults
        </Button>
      </Stack>
    </Stack>
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
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ alignItems: 'center' }}
          >
            <TextField
              label="Juice amount"
              value={juiceAmountValue}
              type="number"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setJuiceAmount(event.target.value);
              }}
              error={!isJuiceAmountValid}
              helperText={!isJuiceAmountValid ? 'Must be greater than zero' : ''}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">oz</InputAdornment>,
                },
              }}
            />
            <TextField
              label="Juice acidity"
              value={acidAmountValue}
              type="number"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setAcidAmount(event.target.value);
              }}
              error={!isAcidAmountValid}
              helperText={!isAcidAmountValid ? 'Must be zero or greater' : ''}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                },
              }}
            />
            <TextField
              label="Target acidity"
              value={targetAcidityValue}
              type="number"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setTargetAcidity(event.target.value);
              }}
              error={!isTargetAcidityValid}
              helperText={
                !isTargetAcidityValid ? 'Must be greater than juice acidity' : ''
              }
              fullWidth
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                },
              }}
            />
          </Stack>
          <TextField
            label="Acid solution to add"
            value={formatNumber(solutionAmount)}
            fullWidth
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: <InputAdornment position="end">ml</InputAdornment>,
              },
            }}
          />
          <Stack
            direction="row"
            role="group"
            aria-label="Solution adjustment actions"
            spacing={1}
            sx={{
              justifyContent: showFullCalculatorLink ? 'space-between' : 'flex-end',
            }}
          >
            {showFullCalculatorLink && <FullCalculatorLink />}
            <Button
              color="secondary"
              onClick={() => {
                setJuiceAmount(initialJuiceAmount);
                setTargetAcidity(DEFAULT_TARGET_ACIDITY.toString());
                setAcidAmount(defaultAcidity.toString());
              }}
              aria-label="Reset juice adjustment to defaults"
            >
              Reset to defaults
            </Button>
          </Stack>
        </Stack>
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

function FullCalculatorLink() {
  const [juiceAmount] = useQueryState('juiceAmount', { defaultValue: '1' });

  return (
    <Link
      href={{
        pathname: '/calculators/acid-adjusting',
        query: { juiceAmount },
      }}
      style={{ textDecoration: 'none' }}
    >
      <Typography
        component="span"
        variant="button"
        color="primary"
        sx={{
          alignItems: 'center',
          borderRadius: 1,
          display: 'inline-flex',
          minHeight: 36,
          px: 1.25,
          py: 0.75,
          '&:hover': { backgroundColor: 'action.hover' },
        }}
      >
        Full calculator
      </Typography>
    </Link>
  );
}

export default function AcidAdjustingCalculator({
  defaultAcidity,
  sx,
  compact = false,
}: {
  defaultAcidity: number;
  sx?: SxProps;
  compact?: boolean;
}) {
  const [type, setType] = useState<'powder' | 'solution'>('solution');
  const [profile, setProfile] = useState<AcidProfile>('lime');

  return (
    <Card sx={sx}>
      <CardHeader
        title="Acid Adjusting"
        action={
          <ToggleButtonGroup
            value={type}
            onChange={(_, value: unknown) =>
              match(value)
                .with('powder', () => setType('powder'))
                .with('solution', () => setType('solution'))
                .otherwise(() => undefined)
            }
            size="small"
            aria-label="Preferred acid-adjusting technique"
            exclusive
          >
            <ToggleButton value="solution">Solution</ToggleButton>
            <ToggleButton value="powder">Powder</ToggleButton>
          </ToggleButtonGroup>
        }
        sx={{ pb: 3 }}
      />
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
      {!compact && (
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Super juice — peel oleation plus acid adjustment for a shelf-stable,
            higher-yield citrus juice — has its own{' '}
            <Link
              href={{ pathname: '/calculators/super-juice' }}
              style={{ textDecoration: 'none' }}
            >
              <Typography
                component="span"
                variant="body2"
                color="primary"
                sx={{ '&:hover': { textDecoration: 'underline' } }}
              >
                Super Juice calculator
              </Typography>
            </Link>
            .
          </Typography>
        </CardContent>
      )}
    </Card>
  );
}
