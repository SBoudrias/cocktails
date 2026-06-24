'use client';

import type { SxProps } from '@mui/material';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  InputAdornment,
  Link as MuiLink,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { match } from 'ts-pattern';
import UnitSelector, { type Unit } from '#/components/Quantity/Selector';
import { tryConvertVolume } from '#/modules/conversion';

const DEFAULT_BATCH_VOLUME = 1000;
const DEFAULT_MILK_RATIO = 25;

function formatAmount(amount: number) {
  return amount.toLocaleString('en', { maximumFractionDigits: 2 });
}

function getInitialDefaults(searchParams: Pick<URLSearchParams, 'get'>) {
  const unit = match(searchParams.get('unit'))
    .returnType<Unit>()
    .with('oz', () => 'oz')
    .otherwise(() => 'ml');
  const convertedDefault = tryConvertVolume(
    { amount: DEFAULT_BATCH_VOLUME, unit: 'ml' },
    unit,
  );
  const contextualBatchVolume = Number(searchParams.get('batchVolume'));
  const batchVolume =
    Number.isFinite(contextualBatchVolume) && contextualBatchVolume > 0
      ? contextualBatchVolume
      : (convertedDefault?.amount ?? DEFAULT_BATCH_VOLUME);
  const contextualMilkRatio = Number(searchParams.get('milkRatio'));
  const milkRatio =
    Number.isFinite(contextualMilkRatio) &&
    contextualMilkRatio > 0 &&
    contextualMilkRatio <= 100
      ? contextualMilkRatio
      : DEFAULT_MILK_RATIO;
  const contextualMilkType = searchParams.get('milkType')?.trim();
  const milkType = contextualMilkType || 'Whole milk';

  return { batchVolume, milkRatio, milkType, unit };
}

export default function MilkClarificationCalculator({ sx }: { sx?: SxProps }) {
  const searchParams = useSearchParams();
  const [initialDefaults] = useState(() => getInitialDefaults(searchParams));
  const [batchVolumeValue, setBatchVolume] = useState<string | number>(
    initialDefaults.batchVolume,
  );
  const [milkRatioValue, setMilkRatio] = useState<string | number>(
    initialDefaults.milkRatio,
  );
  const [milkType, setMilkType] = useState(initialDefaults.milkType);
  const [unit, setUnit] = useState<Unit>(initialDefaults.unit);
  const hasCustomInitialMilkType = match(initialDefaults.milkType)
    .with('Whole milk', 'Coconut milk', 'Other milk', () => false)
    .otherwise(() => true);

  const batchVolume = Number(batchVolumeValue);
  const milkRatio = Number(milkRatioValue);
  const isBatchVolumeValid = Number.isFinite(batchVolume) && batchVolume > 0;
  const isMilkRatioValid =
    Number.isFinite(milkRatio) && milkRatio > 0 && milkRatio <= 100;
  const areInputsValid = isBatchVolumeValid && isMilkRatioValid;
  const milkVolume = areInputsValid ? batchVolume * (milkRatio / 100) : NaN;
  const combinedVolume = areInputsValid ? batchVolume + milkVolume : NaN;

  const instructions = [
    'Prepare the cocktail batch and confirm that it contains enough acidic or astringent ingredients to curdle the selected milk.',
    ...match(milkType)
      .with('Coconut milk', () => [
        'Optionally heat the coconut milk to 60°C (140°F) first to help emulsify it.',
      ])
      .otherwise(() => []),
    `Measure ${areInputsValid ? `${formatAmount(milkVolume)} ${unit}` : 'the calculated amount'} of ${milkType.toLowerCase()} into a container large enough for the combined mixture.`,
    'Slowly add about one third of the cocktail batch to the milk while stirring. Stop stirring once the milk breaks, then gently add the rest of the cocktail.',
    'Let the mixture rest for at least 15 minutes and up to a few hours.',
    'Strain gently through a fine filter. Return the initially cloudy liquid to the filter and avoid disturbing the curd bed as it forms.',
  ];

  const milkGuidance = match(milkType)
    .with(
      'Whole milk',
      () => 'Whole milk contains dairy. Account for milk allergies when serving.',
    )
    .with(
      'Coconut milk',
      () =>
        'Coconut milk products vary in protein, fat, and stabilizers, so test a small batch before scaling up.',
    )
    .with(
      'Other milk',
      () =>
        'Other milks are experimental: their protein and formulation vary, so the default ratio and procedure may not clarify successfully.',
    )
    .otherwise(
      (customMilkType) =>
        `${customMilkType} is treated as a custom milk. Its protein and formulation may vary, so the default ratio and procedure may not clarify successfully.`,
    );

  return (
    <Card sx={sx}>
      <CardHeader title="Milk Clarification" />
      <CardContent>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              label="Pre-milk cocktail batch volume"
              value={batchVolumeValue}
              type="number"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setBatchVolume(event.target.value);
              }}
              error={!isBatchVolumeValid}
              helperText={!isBatchVolumeValid ? 'Must be greater than 0' : ''}
              fullWidth
              slotProps={{
                htmlInput: { min: 0, step: 'any' },
                input: {
                  endAdornment: <InputAdornment position="end">{unit}</InputAdornment>,
                },
              }}
            />
            <TextField
              label="Milk ratio"
              value={milkRatioValue}
              type="number"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setMilkRatio(event.target.value);
              }}
              error={!isMilkRatioValid}
              helperText={!isMilkRatioValid ? 'Must be between 0 and 100' : ''}
              fullWidth
              slotProps={{
                htmlInput: { min: 0, max: 100, step: 'any' },
                input: {
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                },
              }}
            />
          </Stack>
          <TextField
            select
            label="Milk type"
            value={milkType}
            onChange={(event) => {
              setMilkType(event.target.value);
            }}
            fullWidth
          >
            <MenuItem value="Whole milk">Whole milk</MenuItem>
            <MenuItem value="Coconut milk">Coconut milk</MenuItem>
            <MenuItem value="Other milk">Other milk</MenuItem>
            {hasCustomInitialMilkType && (
              <MenuItem value={initialDefaults.milkType}>
                {initialDefaults.milkType}
              </MenuItem>
            )}
          </TextField>
          <Typography id="milk-clarification-results" variant="h6">
            Calculated quantities
          </Typography>
          <Box
            role="status"
            aria-live="polite"
            aria-labelledby="milk-clarification-results"
          >
            {areInputsValid ? (
              <Stack component="dl" direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Box sx={{ flex: 1 }}>
                  <Typography component="dt" color="text.secondary">
                    Milk required
                  </Typography>
                  <Typography component="dd" sx={{ m: 0 }}>
                    {formatAmount(milkVolume)} {unit}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography component="dt" color="text.secondary">
                    Combined pre-filtration volume
                  </Typography>
                  <Typography component="dd" sx={{ m: 0 }}>
                    {formatAmount(combinedVolume)} {unit}
                  </Typography>
                </Box>
              </Stack>
            ) : (
              <Typography color="text.secondary">
                Enter a valid batch volume and milk ratio to calculate quantities.
              </Typography>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            The ratio is milk as a percentage of the cocktail batch before milk is added.
            The 25% default is a starting point from the{' '}
            <MuiLink href="https://www.campariacademy.com/en-us/training/tools-techniques/milk-punch-guide-and-recipes/">
              Campari Academy milk punch guide
            </MuiLink>
            .
          </Typography>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <UnitSelector
              value={unit}
              onChange={(nextUnit) => {
                if (nextUnit === unit) return;

                if (isBatchVolumeValid) {
                  const converted = tryConvertVolume(
                    { amount: batchVolume, unit },
                    nextUnit,
                  );
                  if (converted != null) {
                    setBatchVolume(Math.round(converted.amount * 10_000) / 10_000);
                  }
                }
                setUnit(nextUnit);
              }}
            />
            <Button
              color="secondary"
              onClick={() => {
                setBatchVolume(initialDefaults.batchVolume);
                setMilkRatio(initialDefaults.milkRatio);
                setMilkType(initialDefaults.milkType);
                setUnit(initialDefaults.unit);
              }}
            >
              Reset to defaults
            </Button>
          </Stack>
        </Stack>
      </CardContent>
      <CardContent>
        <Typography id="milk-clarification-instructions" variant="h6" gutterBottom>
          Instructions
        </Typography>
        <Box
          component="ol"
          aria-labelledby="milk-clarification-instructions"
          sx={{ mt: 0, mb: 2, pl: 3 }}
        >
          {instructions.map((instruction) => (
            <li key={instruction}>
              <Typography>{instruction}</Typography>
            </li>
          ))}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {milkGuidance} Always check the selected product label for allergens.
        </Typography>
      </CardContent>
      <CardContent>
        <Typography id="milk-clarification-limitations" variant="h6" gutterBottom>
          Limitations
        </Typography>
        <Box
          component="ul"
          aria-labelledby="milk-clarification-limitations"
          sx={{ mt: 0, mb: 0, pl: 3 }}
        >
          <li>
            <Typography>
              The ratio is a starting heuristic, not a guarantee. Acidity, astringency,
              milk formulation, temperature, and technique all affect clarification.
            </Typography>
          </li>
          <li>
            <Typography>
              This calculator does not determine acid or pH requirements, predict
              filtration loss or clarified yield, or calculate final dilution or alcohol
              content.
            </Typography>
          </li>
          <li>
            <Typography>
              It does not provide shelf-life or food-safety guidance. Store and serve the
              result using appropriate food-safety practices.
            </Typography>
          </li>
        </Box>
      </CardContent>
    </Card>
  );
}
