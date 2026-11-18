import Link from 'next/link';
import CalculatorIcon from './CalculatorIcon';
import styles from './style.module.css';

// One calculator tile: a square link over the sheared glass plate, the
// icon above its short label. Tiles mirror the lean per position, so the
// grid reads as one woven band rather than a toolbar.
const CALCULATORS = [
  {
    slug: 'acid-adjusting',
    label: 'Acid Adjusting',
  },
  {
    slug: 'brix',
    label: 'Brix',
  },
  {
    slug: 'juice-clarification',
    label: 'Juice Clarification',
  },
  {
    slug: 'milk-clarification',
    label: 'Milk Clarification',
  },
  {
    slug: 'saline',
    label: 'Saline',
  },
  {
    slug: 'super-juice',
    label: 'Super Juice',
  },
] as const;

export default function CalculatorTiles() {
  return (
    <ul className={styles.grid} aria-label="Calculators">
      {CALCULATORS.map((calculator) => (
        <li key={calculator.slug}>
          <Link
            href={{ pathname: `/calculators/${calculator.slug}` }}
            className={styles.tile}
          >
            <CalculatorIcon calculator={calculator.slug} />
            <span className={styles.label}>{calculator.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
