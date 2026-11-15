'use client';

import { cn } from 'cn';
import { useId } from 'react';

/**
 * MUI's outlined TextField, on Tailwind tokens: the fieldset is the outline
 * with its label notched into the border (the legend), the unit rides at the
 * input's end, and errors color the border plus the helper line. Metrics are
 * MUI's: 56px tall, 14px label, 12px helper, 1px border that thickens on
 * focus.
 */
export function LabeledField({
  label,
  unit,
  error = false,
  helperText,
  readOnly = false,
  min,
  max,
  step,
  className,
  ...props
}: Omit<React.ComponentProps<'input'>, 'className'> & {
  label: string;
  /** The input's end adornment, MUI's InputAdornment ('grams', '%'…). */
  unit?: string;
  error?: boolean;
  /** The line under the field; only rendered when non-empty. */
  helperText?: string;
  readOnly?: boolean;
  className?: string;
}) {
  // The visible label lives on the fieldset's legend (aria-hidden); pointing
  // aria-labelledby at it still computes the name — labeling is the
  // sanctioned exception to aria-hidden.
  const labelId = useId();
  const describedBy = useId();

  return (
    <div className={cn('relative', className)}>
      <fieldset
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 -top-[9px] rounded-sm border border-input',
          'group-focus-within:border-2 group-focus-within:border-primary',
          error && 'border-destructive group-focus-within:border-destructive',
        )}
      >
        <legend
          id={labelId}
          className="max-w-full truncate px-[5px] text-sm leading-[1.4375] text-muted-foreground group-focus-within:text-primary"
        >
          {label}
        </legend>
      </fieldset>
      <input
        aria-labelledby={labelId}
        aria-describedby={helperText ? describedBy : undefined}
        aria-invalid={error || undefined}
        readOnly={readOnly}
        min={min}
        max={max}
        step={step}
        className={cn(
          'peer h-14 w-full rounded-sm bg-transparent px-[14px] text-base outline-none',
          unit && 'pr-14',
        )}
        {...props}
      />
      {unit && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2 text-base text-muted-foreground"
        >
          {unit}
        </span>
      )}
      {helperText && (
        <span
          id={describedBy}
          className={cn(
            'absolute top-full left-[14px] text-xs leading-4',
            error ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {helperText}
        </span>
      )}
    </div>
  );
}
