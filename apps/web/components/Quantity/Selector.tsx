'use client';

import {
  SegmentedControl,
  SegmentedControlItem,
} from '#/components/ui/segmented-control';

export type Unit = 'oz' | 'ml';

export default function UnitSelector({
  value,
  onChange,
}: {
  value: Unit;
  onChange: (unit: Unit) => void;
}) {
  return (
    // A radio group: pressing the active unit again keeps it, so onValueChange
    // never fires with null from a press.
    <SegmentedControl
      value={value}
      onValueChange={(next) => {
        if (next != null) onChange(next);
      }}
      aria-label="Preferred measurement unit"
    >
      <SegmentedControlItem value="oz">oz</SegmentedControlItem>
      <SegmentedControlItem value="ml">ml</SegmentedControlItem>
    </SegmentedControl>
  );
}
