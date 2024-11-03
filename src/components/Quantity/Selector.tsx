'use client';

import { ToggleButtonGroup, ToggleButton, Toolbar } from '@mui/material';

export type Unit = 'oz' | 'ml';

export default function UnitSelector({
  value,
  onChange,
}: {
  value: Unit;
  onChange: (unit: Unit) => void;
}) {
  return (
    <Toolbar>
      <ToggleButtonGroup
        value={value}
        onChange={(_, newVal) => onChange(newVal === 'oz' ? 'oz' : 'ml')}
        size="small"
        aria-label="Preferred measurement unit"
        exclusive
      >
        <ToggleButton value="oz">oz</ToggleButton>
        <ToggleButton value="ml">ml</ToggleButton>
      </ToggleButtonGroup>
    </Toolbar>
  );
}
