'use client';

import { Select as SelectPrimitive } from '@base-ui/react/select';
import { ChevronDown } from 'lucide-react';
import { OutlinedField } from '#/components/ui/labeled-field';

/**
 * An outlined select field on the shared OutlinedField shell, matching
 * LabeledField's height and notch with an opaque `--paper` dropdown menu so
 * underlying page text does not bleed through.
 */
export function Select<Value extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: Value;
  options: readonly Value[];
  onChange: (value: Value) => void;
  className?: string;
}) {
  return (
    <OutlinedField label={label} className={className}>
      {(labelId) => (
        <SelectPrimitive.Root<Value>
          value={value}
          onValueChange={(nextValue) => {
            if (nextValue != null) onChange(nextValue);
          }}
        >
          <SelectPrimitive.Trigger
            aria-labelledby={labelId}
            className="relative h-14 w-full rounded-sm bg-transparent pr-11 pl-3.5 text-left text-base outline-none"
          >
            <SelectPrimitive.Value />
            <SelectPrimitive.Icon className="absolute top-1/2 right-1.75 -translate-y-1/2 text-foreground">
              <ChevronDown className="size-6" aria-hidden="true" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Positioner
              align="start"
              sideOffset={0}
              // The menu surface: the opaque paper (the same solid the app
              // bar and toasts use) — the translucent glass recipe lets the
              // page bleed through a floating menu that nothing anchors.
              className="z-50 min-w-(--anchor-width) overflow-y-auto rounded-none bg-(--paper) py-2 shadow-(--surface-shadow)"
            >
              <SelectPrimitive.Popup>
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option}
                    value={option}
                    // A menu row: auto rows 36px tall, 16px left padding,
                    // the selected item on primary/16.
                    className="flex h-9 items-center px-4 text-base text-foreground outline-none data-highlighted:bg-muted data-selected:bg-primary/16"
                  >
                    <SelectPrimitive.ItemText>{option}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Popup>
            </SelectPrimitive.Positioner>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      )}
    </OutlinedField>
  );
}
