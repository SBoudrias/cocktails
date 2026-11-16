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
    <SegmentedControl
      value={value}
      onValueChange={onChange}
      aria-label="Preferred measurement unit"
    >
      <SegmentedControlItem value="oz">oz</SegmentedControlItem>
      <SegmentedControlItem value="ml">ml</SegmentedControlItem>
    </SegmentedControl>
  );
}
