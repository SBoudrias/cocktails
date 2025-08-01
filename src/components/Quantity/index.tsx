'use client';

import styles from './style.module.css';
import { RecipeIngredient } from '@/types/Ingredient';
import { convertQuantityToMl } from '@/modules/conversion';
import { Stack } from '@mui/material';

const displayFraction: Record<number, string> = {
  0.125: '⅛',
  0.12: '⅛',
  0.25: '¼',
  0.3: '⅓',
  0.33: '⅓',
  0.375: '⅜',
  0.5: '½',
  0.62: '⅝',
  0.625: '⅝',
  0.66: '⅔',
  0.67: '⅔',
  0.75: '¾',
};

const unitType: Record<
  RecipeIngredient['quantity']['unit'],
  'imperial' | 'metric' | 'other'
> = {
  oz: 'imperial',
  tsp: 'imperial',
  tbsp: 'imperial',
  cup: 'imperial',
  ml: 'metric',
  bottle: 'other',
  dash: 'other',
  drop: 'other',
  gram: 'other',
  pinch: 'other',
  spray: 'other',
  unit: 'other',
  part: 'other',
};

export default function Quantity({
  preferredUnit,
  quantity,
}: {
  preferredUnit: RecipeIngredient['quantity']['unit'];
  quantity: RecipeIngredient['quantity'];
}) {
  const { amount, unit } =
    preferredUnit === 'ml' ? convertQuantityToMl(quantity) : quantity;

  let displayAmount: number | string = amount;
  // Display with a fraction
  if (unit === 'unit' || (unitType[unit] === 'imperial' && amount % 1 !== 0)) {
    const base = Math.floor(amount);
    const fraction = amount - base;
    if (displayFraction[fraction] != null) {
      displayAmount =
        base > 0 ? `${base} ${displayFraction[fraction]}` : displayFraction[fraction];
    }
  }

  return (
    <Stack direction="row" spacing={0.5} alignItems="baseline" flexShrink={0}>
      <span className={styles.quantity}>{displayAmount}</span>
      {unit !== 'unit' && <span className={styles.unit}>{unit}</span>}
    </Stack>
  );
}
