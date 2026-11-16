'use client';

import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group';
import { cn } from 'cn';

// The app's use of this primitive is a single-choice group rendered as one
// fused pill — every consumer (unit picker, bar grouping, book grouping, the
// citrus and acid-profile pickers) wants the same thing: a small outlined
// group. 7px padding (≈38.75px tall), 13px uppercase label, the theme's 1px
// divider border, white unselected and foreground/16 selected.
function ToggleGroup<Value extends string>({
  className,
  fullWidth = false,
  children,
  ...props
}: ToggleGroupPrimitive.Props<Value> & {
  /** Full width: the group spans its row, each button sharing it by
   * content (width:100% with shrink allowed). */
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
        'shrink-0 rounded-none border bg-transparent text-[13px] leading-[1.75] font-medium whitespace-nowrap uppercase outline-none transition-all',
        'first:rounded-s-lg last:rounded-e-lg first:border-l-0',
        'p-1.75 text-white hover:text-foreground aria-pressed:bg-foreground/16 aria-pressed:text-foreground',
        'focus-visible:z-10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
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
