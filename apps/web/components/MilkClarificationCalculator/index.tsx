'use client';

import { tryConvertVolume } from '@cocktails/conversion';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { SxProps } from '@mui/material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  InputAdornment,
  Link as MuiLink,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useReducer } from 'react';
import { match } from 'ts-pattern';
import UnitSelector, { type Unit } from '#/components/Quantity/Selector';
import { formatAmount } from '#/modules/formatAmount';
import { getMilkClarifiedRecipeListUrl } from '#/modules/url';

const DEFAULT_BATCH_VOLUME = 1000;
const DEFAULT_MILK_RATIO = 0.25;
const MILK_TYPES = ['Whole milk', 'Coconut milk', 'Other milk'];
const FRIENDLY_VOLUME_STEPS: Record<Unit, number> = { ml: 5, oz: 0.25 };

function isValidBatchVolume(value: string | number) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

function roundToFriendlyVolume(amount: number, unit: Unit) {
  const step = FRIENDLY_VOLUME_STEPS[unit];
  const rounded = Math.round(amount / step) * step;
  return rounded > 0 ? rounded : amount;
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

function getInitialBatchVolume(searchParams: Pick<URLSearchParams, 'get'>) {
  const unit: Unit = match(searchParams.get('unit'))
    .with('oz', () => 'oz' as const)
    .otherwise(() => 'ml' as const);
  const amount = Number(searchParams.get('amount'));

  if (!isValidBatchVolume(amount)) {
    return {
      batchVolumeValue: DEFAULT_BATCH_VOLUME as string | number,
      batchVolumeMilliliters: DEFAULT_BATCH_VOLUME,
      unit: 'ml' as Unit,
    };
  }

  const batchVolume = roundToFriendlyVolume(amount, unit);

  return {
    batchVolumeValue: batchVolume,
    batchVolumeMilliliters: getMilliliters(batchVolume, unit),
    unit,
  };
}

function getInitialMilkRatio(searchParams: Pick<URLSearchParams, 'get'>) {
  const ratio = Number(searchParams.get('ratio'));
  const isRecipeRatio = Number.isFinite(ratio) && ratio > 0 && ratio < 1;

  return {
    milkRatio: isRecipeRatio ? ratio : DEFAULT_MILK_RATIO,
    hasRecipeMilkRatio: isRecipeRatio,
  };
}

function formatMilkRatioPercent(ratio: number) {
  const percent = ratio * 100;
  return Number.isInteger(percent) ? percent : Math.round(percent * 10) / 10;
}

type CalculatorState = {
  batchVolumeMilliliters: number;
  batchVolumeValue: string | number;
  milkRatio: number;
  hasRecipeMilkRatio: boolean;
  milkType: string;
  customMilkType: string | undefined;
  unit: Unit;
};

function getInitialState(searchParams: Pick<URLSearchParams, 'get'>): CalculatorState {
  const milkType = normalizeMilkType(searchParams.get('milkType'));

  return {
    ...getInitialBatchVolume(searchParams),
    ...getInitialMilkRatio(searchParams),
    milkType,
    customMilkType: MILK_TYPES.includes(milkType) ? undefined : milkType,
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
      ...(isValidBatchVolume(value)
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
      if (!isValidBatchVolume(state.batchVolumeValue)) {
        return { ...state, unit };
      }

      const converted = tryConvertVolume(
        { amount: state.batchVolumeMilliliters, unit: 'ml' },
        unit,
      );

      return {
        ...state,
        batchVolumeValue:
          converted == null
            ? state.batchVolumeValue
            : roundToFriendlyVolume(converted.amount, unit),
        unit,
      };
    })
    .exhaustive();
}

export default function MilkClarificationCalculator({ sx }: { sx?: SxProps }) {
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(calculatorReducer, searchParams, getInitialState);
  const {
    batchVolumeValue,
    milkRatio,
    hasRecipeMilkRatio,
    milkType,
    customMilkType,
    unit,
  } = state;
  const isBatchVolumeValid = isValidBatchVolume(batchVolumeValue);
  const milkVolume = isBatchVolumeValid
    ? roundToFriendlyVolume(Number(batchVolumeValue) * milkRatio, unit)
    : NaN;
  const milkQuantityText = isBatchVolumeValid
    ? `${formatAmount(milkVolume)} ${unit} of ${milkType.toLowerCase()}`
    : 'the milk';

  const milkGuidance = match(milkType)
    .with('Whole milk', () => undefined)
    .otherwise(() => 'Results vary by product, so test a small batch before scaling up.');

  const instructions = [
    ...match(milkType)
      .with('Coconut milk', () => ['Warm it first if needed to emulsify.'])
      .otherwise(() => []),
    'Make sure the cocktail batch has enough acidity or astringency to curdle the milk.',
    `Put the ${milkQuantityText} in a large container. Slowly stir in one third of the cocktail. Stop stirring when curds form, then gently add the rest without stirring.`,
    'Rest for at least 15 minutes, then filter gently through a coffee filter or fine strainer without disturbing the curds. Pour the first cloudy filtrate back through the same curd bed.',
  ];

  return (
    <>
      <Card sx={sx}>
        <CardContent component="section" aria-label="Milk quantity">
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Cocktail batch volume"
                value={batchVolumeValue}
                type="number"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  dispatch({ type: 'change-batch-volume', value: event.target.value });
                }}
                error={!isBatchVolumeValid}
                helperText={
                  isBatchVolumeValid
                    ? 'Cocktail mixture before adding milk.'
                    : 'Must be greater than 0'
                }
                fullWidth
                slotProps={{
                  htmlInput: { min: 0, step: 'any' },
                  input: {
                    endAdornment: <InputAdornment position="end">{unit}</InputAdornment>,
                  },
                }}
              />
              <TextField
                label={
                  hasRecipeMilkRatio
                    ? 'Recipe milk-to-batch ratio'
                    : 'Milk-to-batch ratio'
                }
                value={formatMilkRatioPercent(milkRatio)}
                fullWidth
                slotProps={{
                  input: {
                    readOnly: true,
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  },
                }}
              />
            </Stack>
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
              {customMilkType && (
                <MenuItem value={customMilkType}>{customMilkType}</MenuItem>
              )}
            </TextField>
            <UnitSelector
              value={unit}
              onChange={(nextUnit) => {
                dispatch({ type: 'change-unit', value: nextUnit });
              }}
            />
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
              {milkGuidance && (
                <Typography variant="body2" color="text.secondary">
                  {milkGuidance}
                </Typography>
              )}
            </Box>
            {!hasRecipeMilkRatio && (
              <Typography variant="body2" color="text.secondary">
                This uses a {formatMilkRatioPercent(milkRatio)}% milk-to-batch starting
                point from the{' '}
                <MuiLink
                  href="https://www.campariacademy.com/en-us/training/tools-techniques/milk-punch-guide-and-recipes/"
                  target="_blank"
                  rel="noopener nofollow"
                >
                  Campari Academy milk punch guide
                </MuiLink>
                . If following a recipe, use its specified milk quantity instead of this
                general starting point.
              </Typography>
            )}
            <Alert severity="warning">
              Clarified dairy milk punch still contains dairy allergens. Check alternative
              milks for nut or soy allergens.
            </Alert>
          </Stack>
        </CardContent>
      </Card>
      <Box component="section" aria-label="Instructions">
        <List>
          <ListSubheader>Instructions</ListSubheader>
          <Paper square>
            {instructions.map((instruction, index) => (
              <ListItem divider key={instruction}>
                <ListItemText sx={{ textTransform: 'none' }}>
                  {index + 1}. {instruction}
                </ListItemText>
              </ListItem>
            ))}
          </Paper>
        </List>
      </Box>
      <List>
        <Paper square>
          <Link href={getMilkClarifiedRecipeListUrl()}>
            <ListItem divider secondaryAction={<ChevronRightIcon />}>
              <ListItemText
                primary="Browse milk-clarified recipes"
                sx={{ textTransform: 'none' }}
              />
            </ListItem>
          </Link>
        </Paper>
      </List>
    </>
  );
}
