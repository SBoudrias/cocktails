'use client';

import { tryConvertVolume } from '@cocktails/conversion';
import type { RecipeIngredient } from '@cocktails/data';
import { Box } from '@mui/material';
import { match } from 'ts-pattern';
import { roundToFriendlyFraction, roundToFriendlyMl } from '#/modules/friendly-rounding';
import styles from './style.module.css';

const displayFraction: Record<number, string> = {
  0.125: '⅛',
  0.12: '⅛',
  0.13: '⅛',
  0.17: '⅙',
  0.167: '⅙',
  0.25: '¼',
  0.3: '⅓',
  0.33: '⅓',
  0.37: '⅜',
  0.375: '⅜',
  0.38: '⅜',
  0.5: '½',
  0.62: '⅝',
  0.625: '⅝',
  0.63: '⅝',
  0.66: '⅔',
  0.67: '⅔',
  0.75: '¾',
  0.83: '⅚',
  0.833: '⅚',
  0.87: '⅞',
  0.875: '⅞',
  0.88: '⅞',
};

const unitType: Record<
  RecipeIngredient['quantity']['unit'],
  'imperial' | 'metric' | 'weight' | 'counting'
> = {
  oz: 'imperial',
  tsp: 'imperial',
  tbsp: 'imperial',
  cup: 'imperial',
  unit: 'imperial',
  ml: 'metric',
  gram: 'weight',
  bottle: 'counting',
  dash: 'counting',
  drop: 'counting',
  pinch: 'counting',
  spray: 'counting',
  part: 'counting',
};

function formatAmount(
  amount: number,
  unit: RecipeIngredient['quantity']['unit'],
): number | string {
  if (unitType[unit] === 'imperial') {
    const rounded = roundToFriendlyFraction(amount, unit);
    const base = Math.floor(rounded);
    const fraction = Math.round((rounded - base + Number.EPSILON) * 100) / 100;

    if (fraction === 0) {
      return base;
    }
    if (displayFraction[fraction] != null) {
      return base > 0
        ? `${base} ${displayFraction[fraction]}`
        : displayFraction[fraction];
    }
    return rounded;
  }
  if (unitType[unit] === 'metric') {
    return roundToFriendlyMl(amount);
  }
  if (unitType[unit] === 'weight') {
    return Math.round(amount * 10) / 10;
  }
  return Math.round(amount);
}

function shouldConvertForDisplay(quantity: RecipeIngredient['quantity']) {
  return unitType[quantity.unit] !== 'counting';
}

export default function Quantity({
  preferredUnit,
  quantity,
}: {
  preferredUnit: 'ml' | 'oz';
  quantity: RecipeIngredient['quantity'];
}) {
  const { amount, maximum, modifier, unit } = match(preferredUnit)
    .with('ml', () =>
      shouldConvertForDisplay(quantity)
        ? (tryConvertVolume(quantity, 'ml') ?? quantity)
        : quantity,
    )
    .with('oz', () =>
      match(quantity)
        .with(
          { unit: 'ml' },
          (metricQuantity) => tryConvertVolume(metricQuantity, 'oz') ?? metricQuantity,
        )
        .otherwise((imperialQuantity) => imperialQuantity),
    )
    .exhaustive();

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        flexDirection: 'row',
        gap: 0.5,
        alignItems: 'baseline',
        flexShrink: 0,
      }}
    >
      {modifier != null && <span className={styles.modifier}>{modifier}</span>}
      <span className={styles.quantity}>{formatAmount(amount, unit)}</span>
      {maximum != null && (
        <>
          <span className={styles.modifier}>to</span>
          <span className={styles.quantity}>{formatAmount(maximum, unit)}</span>
        </>
      )}
      {unit !== 'unit' && <span className={styles.unit}>{unit}</span>}
    </Box>
  );
}
