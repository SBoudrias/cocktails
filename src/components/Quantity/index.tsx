import { Space } from 'antd-mobile';
import styles from './style.module.css';
import { Unit } from '@/types/Ingredient';

const displayFraction: Record<number, string> = {
  0.25: '¼',
  0.5: '½',
  0.75: '¾',
};

export default function Quantity({ amount, unit }: { amount: number; unit: Unit }) {
  let displayAmount: number | string = amount;
  // Display with a fraction
  if (unit === 'oz' && amount % 1 !== 0) {
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
