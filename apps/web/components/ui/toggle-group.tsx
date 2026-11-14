'use client';

import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import * as React from 'react';

// The app's only use is a single-choice unit picker (Quantity/Selector)
// rendered as one fused pill: outline variant, zero spacing between items.
// Metrics measured from the MUI ToggleButtonGroup size=small it replaces:
// 7px padding (≈38.75px tall), 13px uppercase label, the theme's 1px
// divider border, selected at foreground/16 like MUI's standard toggle.
const toggleVariants = cva(
  "uppercase group/toggle inline-flex items-center justify-center rounded-lg text-[13px] leading-[1.75] font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-transparent text-white hover:text-foreground aria-pressed:bg-foreground/16 aria-pressed:text-foreground',
        outline:
          'border border-border bg-transparent text-white hover:text-foreground aria-pressed:bg-foreground/16 aria-pressed:text-foreground',
      },
      size: {
        default: 'min-w-8 px-[7px] py-[7px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & { spacing?: number }
>({
  size: 'default',
  variant: 'default',
  spacing: 2,
});

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 2,
  children,
  ...props
}: ToggleGroupPrimitive.Props &
  VariantProps<typeof toggleVariants> & {
    /** Gap between items; 0 fuses the items into one pill. */
    spacing?: number;
  }) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      className={cn(
        'group/toggle-group flex w-fit flex-row items-center rounded-lg',
        spacing === 0 ? 'gap-0' : 'gap-2',
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size, spacing }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  );
}

function ToggleGroupItem({
  className,
  children,
  variant = 'default',
  size = 'default',
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext);

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        // MUI's joined ToggleButtonGroup: no radius between items, the
        // divider border dropped on every item but the first.
        'shrink-0 focus:z-10 focus-visible:z-10 group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:first:rounded-s-lg group-data-[spacing=0]/toggle-group:last:rounded-e-lg group-data-[spacing=0]/toggle-group:data-[variant=outline]:border-l-0 group-data-[spacing=0]/toggle-group:data-[variant=outline]:first:border-l',
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  );
}

export { ToggleGroup, ToggleGroupItem };
