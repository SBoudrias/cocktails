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
      variant="outline"
      spacing={0}
      aria-label="Preferred measurement unit"
    >
      {/* MUI's small ToggleButton metrics live in the primitive: 7px padding,
          13px label, 38.75px tall. */}
      <ToggleGroupItem value="oz">oz</ToggleGroupItem>
      <ToggleGroupItem value="ml">ml</ToggleGroupItem>
    </ToggleGroup>
  );
}
