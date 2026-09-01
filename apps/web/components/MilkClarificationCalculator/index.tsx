'use client';

import { tryConvertVolume } from '@cocktails/conversion';
import type { SxProps } from '@mui/material';
import {
  Box,
  Card,
  CardContent,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useReducer } from 'react';
import { match } from 'ts-pattern';
import UnitSelector, { type Unit } from '#/components/Quantity/Selector';
import { formatAmount } from '#/modules/formatAmount';

const DEFAULT_BATCH_VOLUME = 1000;
const MILK_RATIO = 0.25;
const MILK_TYPES = ['Whole milk', 'Coconut milk', 'Other milk'];

function roundVolumeInput(amount: number) {
  return Math.round(amount * 10_000) / 10_000;
}

function getMilliliters(amount: number, unit: Unit) {
  return tryConvertVolume({ amount, unit }, 'ml')?.amount ?? amount;
}

function normalizeMilkType(milkType: string | null) {
  const normalizedMilkType = milkType?.trim().replace(/\s+/g, ' ');

  if (!normalizedMilkType) {
    return 'Whole milk';
  }

  return (
    MILK_TYPES.find(
      (canonicalMilkType) =>
        canonicalMilkType.toLowerCase() === normalizedMilkType.toLowerCase(),
    ) ?? normalizedMilkType
  );
}

type CalculatorState = {
  batchVolumeMilliliters: number;
  batchVolumeValue: string | number;
  milkType: string;
  unit: Unit;
};

function getInitialState(searchParams: Pick<URLSearchParams, 'get'>): CalculatorState {
  return {
    batchVolumeMilliliters: DEFAULT_BATCH_VOLUME,
    batchVolumeValue: DEFAULT_BATCH_VOLUME,
    milkType: normalizeMilkType(searchParams.get('milkType')),
    unit: 'ml',
  };
}

type CalculatorAction =
  | { type: 'change-batch-volume'; value: string }
  | { type: 'change-milk-type'; value: string }
  | { type: 'change-unit'; value: Unit };

function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction,
): CalculatorState {
  return match(action)
    .with({ type: 'change-batch-volume' }, ({ value }) => ({
      ...state,
      ...(Number.isFinite(Number(value)) && Number(value) > 0
        ? { batchVolumeMilliliters: getMilliliters(Number(value), state.unit) }
        : {}),
      batchVolumeValue: value,
    }))
    .with({ type: 'change-milk-type' }, ({ value }) => ({
      ...state,
      milkType: value,
    }))
    .with({ type: 'change-unit' }, ({ value: unit }) => {
      if (unit === state.unit) {
        return state;
      }

      const converted = tryConvertVolume(
        { amount: state.batchVolumeMilliliters, unit: 'ml' },
        unit,
      );

      return {
        ...state,
        batchVolumeValue:
          converted == null ? state.batchVolumeValue : roundVolumeInput(converted.amount),
        unit,
      };
    })
    .exhaustive();
}

export default function MilkClarificationCalculator({ sx }: { sx?: SxProps }) {
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(calculatorReducer, searchParams, getInitialState);
  const { batchVolumeValue, milkType, unit } = state;
  const hasCustomMilkType = !MILK_TYPES.includes(milkType);
  const batchVolume = Number(batchVolumeValue);
  const isBatchVolumeValid = Number.isFinite(batchVolume) && batchVolume > 0;
  const milkVolume = isBatchVolumeValid ? batchVolume * MILK_RATIO : NaN;

  const milkGuidance = match(milkType)
    .with('Coconut milk', () => 'Warm it first if needed to emulsify.')
    .with(
      'Other milk',
      () => 'Results vary by product, so test a small batch before scaling up.',
    )
    .otherwise(() => undefined);

  return (
    <Card sx={sx}>
      <CardContent>
        <Stack spacing={2}>
          <TextField
            label="Cocktail batch volume"
            value={batchVolumeValue}
            type="number"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              dispatch({ type: 'change-batch-volume', value: event.target.value });
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
            select
            label="Milk"
            value={milkType}
            onChange={(event) => {
              dispatch({ type: 'change-milk-type', value: event.target.value });
            }}
            fullWidth
          >
            {MILK_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
            {hasCustomMilkType && <MenuItem value={milkType}>{milkType}</MenuItem>}
          </TextField>
          <Box role="status" aria-live="polite">
            {isBatchVolumeValid ? (
              <Typography variant="h5">
                Add {formatAmount(milkVolume)} {unit} of {milkType.toLowerCase()}
              </Typography>
            ) : (
              <Typography color="text.secondary">
                Enter a valid batch volume to calculate the milk to add.
              </Typography>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            This uses a 25% milk-to-batch starting point from the{' '}
            <a href="https://www.campariacademy.com/en-us/training/tools-techniques/milk-punch-guide-and-recipes/">
              Campari Academy milk punch guide
            </a>
            .
          </Typography>
          <UnitSelector
            value={unit}
            onChange={(nextUnit) => {
              dispatch({ type: 'change-unit', value: nextUnit });
            }}
          />
        </Stack>
      </CardContent>
      <CardContent>
        <Typography id="milk-clarification-method" variant="h6" gutterBottom>
          Method
        </Typography>
        <Box
          component="ol"
          aria-labelledby="milk-clarification-method"
          sx={{ m: 0, pl: 3 }}
        >
          <li>
            <Typography>
              Make sure the cocktail batch has enough acidity or astringency to curdle the
              milk.
            </Typography>
          </li>
          <li>
            <Typography>
              Put the milk in a large container, then slowly add the cocktail while
              stirring.
            </Typography>
          </li>
          <li>
            <Typography>
              Let it rest, then filter gently without disturbing the curds.
            </Typography>
          </li>
        </Box>
        {milkGuidance && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {milkGuidance}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
