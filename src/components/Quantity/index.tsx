'use client';

import styles from './style.module.css';
import { Unit } from '@/types/Recipe';
import { convertQuantityToMl } from '@/modules/conversion';
import { Stack } from '@mui/material';

const displayFraction: Record<number, string> = {
  0.125: '⅛',
  0.12: '⅛',
  0.25: '¼',
  0.3: '⅓',
  0.33: '⅓',
  0.5: '½',
  0.62: '⅝',
  0.625: '⅝',
  0.66: '⅔',
  0.67: '⅔',
  0.75: '¾',
};

const unitType: Record<Unit, 'imperial' | 'metric' | 'other'> = {
  oz: 'imperial',
  tsp: 'imperial',
  tbsp: 'imperial',
  ml: 'metric',
  dash: 'other',
  drop: 'other',
  unit: 'other',
};

export default function Quantity({
  preferredUnit,
  quantity,
}: {
  preferredUnit: Unit;
  quantity: { amount: number; unit: Unit };
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
    <Stack direction="row" spacing={0.5} alignItems="baseline">
      <span className={styles.quantity}>{displayAmount}</span>
      {unit !== 'unit' && <span className={styles.unit}>{unit}</span>}
    </Stack>
  );
}
