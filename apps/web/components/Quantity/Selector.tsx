'use client';

import { SegmentedControl } from '@mantine/core';

export type Unit = 'oz' | 'ml';

export default function UnitSelector({
  value,
  onChange,
}: {
  value: Unit;
  onChange: (unit: Unit) => void;
}) {
  return (
    <SegmentedControl
      value={value}
      onChange={(newVal) => onChange(newVal === 'oz' ? 'oz' : 'ml')}
      data={['oz', 'ml']}
      size="sm"
      aria-label="Preferred measurement unit"
    />
  );
}
