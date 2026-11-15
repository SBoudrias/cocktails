'use client';

import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group';

export type Unit = 'oz' | 'ml';

export default function UnitSelector({
  value,
  onChange,
}: {
  value: Unit;
  onChange: (unit: Unit) => void;
}) {
  return (
    <ToggleGroup
      value={[value]}
      // A single-choice group: pressing the active unit again keeps it.
      onValueChange={([newVal]) => {
        if (newVal != null) onChange(newVal === 'oz' ? 'oz' : 'ml');
      }}
      aria-label="Preferred measurement unit"
    >
      <ToggleGroupItem value="oz">oz</ToggleGroupItem>
      <ToggleGroupItem value="ml">ml</ToggleGroupItem>
    </ToggleGroup>
  );
}
