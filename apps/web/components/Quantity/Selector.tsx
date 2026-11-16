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
      value={value}
      onValueChange={onChange}
      aria-label="Preferred measurement unit"
    >
      <ToggleGroupItem value="oz">oz</ToggleGroupItem>
      <ToggleGroupItem value="ml">ml</ToggleGroupItem>
    </ToggleGroup>
  );
}
