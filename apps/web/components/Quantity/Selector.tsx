'use client';

import { Button, ButtonGroup } from '@mantine/core';
import styles from './selector.module.css';

export type Unit = 'oz' | 'ml';

const UNITS: Unit[] = ['oz', 'ml'];

// A pair of pressed-state buttons, not Mantine's SegmentedControl: that one
// is a radio group with its own pill look, where the app's unit picker is
// the MUI ToggleButtonGroup's outlined pair.
export default function UnitSelector({
  value,
  onChange,
}: {
  value: Unit;
  onChange: (unit: Unit) => void;
}) {
  return (
    <ButtonGroup aria-label="Preferred measurement unit">
      {UNITS.map((unit) => (
        <Button
          key={unit}
          variant="default"
          aria-pressed={unit === value}
          onClick={() => onChange(unit)}
          // MUI's small ToggleButton metrics, over the theme's text button
          h={39}
          px={7}
          fz={13}
          className={styles.unit}
        >
          {unit}
        </Button>
      ))}
    </ButtonGroup>
  );
}
