'use client';

import type { PartProps } from '@ui-sdk/react/primitive';
import {
  SegmentedControl as SegmentedControlRoot,
  SegmentedControlItem as SegmentedControlItemRoot,
  type SegmentedControlItemState,
  type SegmentedControlOptions,
  type SegmentedControlState,
} from '@ui-sdk/react/segmented-control';
import { cn } from 'cn';

// The app's use of this primitive is a single-choice group rendered as one
// fused pill — every consumer (unit picker, bar grouping, book grouping, the
// citrus and acid-profile pickers) wants the same thing: a small outlined
// group. 7px padding, 13px uppercase label, the theme's 1px divider border,
// white unselected and foreground/16 selected.
function SegmentedControl<Value extends string>({
  className,
  fullWidth = false,
  children,
  ...props
}: SegmentedControlOptions<Value> &
  Omit<
    PartProps<'div', SegmentedControlState>,
    'defaultValue' | 'onChange' | 'onSelect'
  > & {
    /** Full width: the group spans its row, each item sharing it by
     * content (width:100% with shrink allowed). */
    fullWidth?: boolean;
  }) {
  return (
    <SegmentedControlRoot<Value>
      className={cn(
        // web.css gives every segmented control a 1px border, 2px padding
        // and a 2px gap; this app's pill look is carried by the items
        // alone, so the group neutralizes its defaults.
        'flex w-fit flex-row items-center gap-0 rounded-lg border-0 bg-transparent p-0',
        // The bang: the items carry flex-none themselves, and the parent's
        // [&>*] selector can't beat it on order alone.
        fullWidth && 'w-full [&>*]:w-full [&>*]:shrink!',
        className,
      )}
      {...props}
    >
      {children}
    </SegmentedControlRoot>
  );
}

// Joined pill: no radius between items, the divider border kept only on the
// first item's left edge. Items are first-of-type/last-of-type — not
// first/last — because each item renders a hidden native radio after its
// button, so the buttons are not adjacent children of the group.
function SegmentedControlItem({
  className,
  children,
  ...props
}: Omit<PartProps<'button', SegmentedControlItemState>, 'value' | 'onSelect'> & {
  value: string;
}) {
  return (
    <SegmentedControlItemRoot
      className={cn(
        'h-auto flex-none rounded-none border bg-transparent text-[13px] leading-[1.75] font-medium whitespace-nowrap uppercase outline-none transition',
        '[&:first-of-type]:rounded-s-lg [&:last-of-type]:rounded-e-lg [&:first-of-type]:border-l-0',
        // Unselected labels sit deliberately pure white — brighter than the
        // foreground's cyan cast — so the picked item reads at a glance.
        'p-1.75 text-white hover:text-foreground data-checked:bg-foreground/16 data-checked:text-foreground',
        'focus-visible:z-10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </SegmentedControlItemRoot>
  );
}

export { SegmentedControl, SegmentedControlItem };
