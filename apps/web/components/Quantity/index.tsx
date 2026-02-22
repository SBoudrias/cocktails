'use client';

import type { RecipeIngredient } from '@cocktails/data';
import { Stack } from '@mui/material';
import { match } from 'ts-pattern';
import { convertQuantityToMl, convertQuantityToOz } from '#/modules/conversion';
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

export default function Quantity({
  preferredUnit,
  quantity,
}: {
  preferredUnit: 'ml' | 'oz';
  quantity: RecipeIngredient['quantity'];
}) {
  const { amount, unit } = match(preferredUnit)
    .with('ml', () => convertQuantityToMl(quantity))
    .with('oz', () => convertQuantityToOz(quantity))
    .exhaustive();

  let displayAmount: number | string;

  if (unitType[unit] === 'imperial') {
    const rounded = roundToFriendlyFraction(amount, unit);
    const base = Math.floor(rounded);
    const fraction = Math.round((rounded - base + Number.EPSILON) * 100) / 100;

    if (fraction === 0) {
      displayAmount = base;
    } else if (displayFraction[fraction] != null) {
      displayAmount =
        base > 0 ? `${base} ${displayFraction[fraction]}` : displayFraction[fraction];
    } else {
      displayAmount = rounded;
    }
  } else if (unitType[unit] === 'metric') {
    displayAmount = roundToFriendlyMl(amount);
  } else if (unitType[unit] === 'weight') {
    displayAmount = Math.round(amount * 10) / 10;
  } else {
    displayAmount = Math.round(amount);
  }

  return (
    <Stack
      component="span"
      direction="row"
      spacing={0.5}
      alignItems="baseline"
      flexShrink={0}
    >
      <span className={styles.quantity}>{displayAmount}</span>
      {unit !== 'unit' && <span className={styles.unit}>{unit}</span>}
    </Stack>
  );
}
