'use client';

import { cn } from 'cn';
import { useId } from 'react';

/**
 * MUI's outlined TextField, on Tailwind tokens. Same architecture MUI uses:
 * the fieldset is the outline, absolutely positioned 5px above the field so
 * its top border rides above the input's box; the legend inside it is an
 * invisible sizer (11px tall, its span 12px + 5px side padding) that holds
 * the border open around the label; the visible label is a separate span
 * MUI's InputLabel drew — 12px text at 14px from the field's left, its
 * 23px/0.75 line box 9px above the field. Errors color border, label and
 * helper; focus thickens the border to 2px and colors the label.
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
  // The label is the visible span below; pointing aria-labelledby at it
  // keeps the field's accessible name in the DOM the user sees.
  const labelId = useId();
  const describedBy = useId();

  return (
    <div className={cn('relative h-14', className)}>
      {/* The visible label, before the fieldset in DOM order so text-based
          queries (the gate, assistive tech) find it first. MUI draws it as
          16px/23px text scaled to 0.75 — kept as the literal transform so
          the rasterization matches too. */}
      <span
        id={labelId}
        className={cn(
          'absolute top-0 left-0 origin-top-left text-[16px] leading-[23px] whitespace-nowrap',
          '[transform:matrix(0.75,0,0,0.75,14,-9)]',
          'text-muted-foreground group-focus-within:text-primary',
          error && 'text-destructive group-focus-within:text-destructive',
        )}
      >
        {label}
      </span>
      <fieldset
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 -top-[5px] m-0 overflow-hidden rounded-sm border border-input px-2',
          'group-focus-within:border-2 group-focus-within:border-primary',
          error && 'border-destructive group-focus-within:border-destructive',
        )}
      >
        {/* The invisible sizer: its width is the notch. MUI keeps it even
            when the border is notched so the gap is 5px wider than the
            text on each side. */}
        <legend className="block h-[11px] max-w-full p-0">
          <span
            aria-hidden="true"
            className="block px-[5px] text-xs leading-[23px] whitespace-nowrap opacity-0"
          >
            {label}
          </span>
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
          // MUI's input text: 16px on a 23px line box, the 56px height
          // split 16.5px padding + 23px + 16.5px.
          'peer h-14 w-full rounded-sm bg-transparent px-[14px] text-base leading-[23px] outline-none',
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
