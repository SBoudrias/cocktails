'use client';

import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group';
import { cn } from 'cn';

// The app's use of this primitive is a single-choice group rendered as one
// fused pill — every consumer (unit picker, bar grouping, book grouping, the
// citrus and acid-profile pickers) wants the same thing: MUI's
// ToggleButtonGroup size=small outline. Metrics measured from it: 7px
// padding (≈38.75px tall), 13px uppercase label, the theme's 1px divider
// border, white unselected and foreground/16 selected.
function ToggleGroup<Value extends string>({
  className,
  fullWidth = false,
  children,
  ...props
}: ToggleGroupPrimitive.Props<Value> & {
  /** MUI's fullWidth: the group spans its row, each button sharing it by
   * content (width:100% with shrink allowed — probed at 183px/183px for
   * two, all five citrus buttons filling the row without overflow). */
  fullWidth?: boolean;
}) {
  return (
    <ToggleGroupPrimitive<Value>
      data-slot="toggle-group"
      className={cn(
        'flex w-fit flex-row items-center rounded-lg gap-0',
        // The bang: the items carry shrink-0 themselves, and the parent's
        // [&>*] selector can't beat it on order alone.
        fullWidth && 'w-full [&>*]:w-full [&>*]:shrink!',
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive>
  );
}

function ToggleGroupItem({ className, children, ...props }: TogglePrimitive.Props) {
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(
        // Joined pill: no radius between items, the divider border kept
        // only on the first item's left edge. shrink-0 keeps each item
        // its content width — the fullWidth groups override it to shrink.
        'shrink-0 rounded-none border border-border bg-transparent text-[13px] leading-[1.75] font-medium whitespace-nowrap uppercase outline-none transition-all',
        'first:rounded-s-lg last:rounded-e-lg first:border-l-0',
        'px-[7px] py-[7px] text-white hover:text-foreground aria-pressed:bg-foreground/16 aria-pressed:text-foreground',
        'focus-visible:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  );
}

export { ToggleGroup, ToggleGroupItem };
