'use client';

import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group';

export type Unit = 'oz' | 'ml';

const unitClass =
  'h-[39px] px-[7px] group-data-[spacing=0]/toggle-group:px-[7px] text-[13px] text-white aria-pressed:bg-white/16';

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
      {/* MUI's small ToggleButton metrics: 7px padding, 13px label */}
      <ToggleGroupItem value="oz" className={unitClass}>
        oz
      </ToggleGroupItem>
      <ToggleGroupItem value="ml" className={unitClass}>
        ml
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
