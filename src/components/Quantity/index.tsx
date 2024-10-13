import { Space } from 'antd-mobile';
import styles from './style.module.css';
import { Unit } from '@/types/Ingredient';

const displayFraction: Record<number, string> = {
  0.125: '⅛',
  0.12: '⅛',
  0.25: '¼',
  0.3: '⅓',
  0.33: '⅓',
  0.5: '½',
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
};

export default function Quantity({ amount, unit }: { amount: number; unit: Unit }) {
  let displayAmount: number | string = amount;
  // Display with a fraction
  if (unitType[unit] === 'imperial' && amount % 1 !== 0) {
    const base = Math.floor(amount);
    const fraction = amount - base;
    if (fraction in displayFraction) {
      displayAmount =
        base > 0 ? `${base} ${displayFraction[fraction]}` : displayFraction[fraction];
    }
  }

  return (
    <Space align="baseline" style={{ '--gap': '2px', fontSize: '1.2em' }}>
      <span className={styles.quantity}>{displayAmount}</span>
      <span className={styles.unit}>{unit}</span>
    </Space>
  );
}
