'use client';

import { cn } from 'cn';
import { useId } from 'react';

/**
 * MUI's outlined-field shell: the fieldset is the outline, absolutely
 * positioned 5px above the field so its top border rides above the input's
 * box; the legend inside it is an invisible sizer (11px tall, its span 12px
 * + 5px side padding) that holds the border open around the label; the
 * visible label is a separate span MUI's InputLabel drew — 16px/23px text
 * under the literal matrix(0.75, 0, 0, 0.75, 14, -9) transform (kept as the
 * literal so the rasterization matches). Focus thickens the border to 2px
 * and colors the label (the `group` here is what the group-focus-within
 * variants hang on); errors color border and label.
 */
export function OutlinedField({
  label,
  error = false,
  className,
  children,
}: {
  label: string;
  error?: boolean;
  className?: string;
  /** The control; receives the label span's id for aria-labelledby. */
  children: (labelId: string) => React.ReactNode;
}) {
  const labelId = useId();

  return (
    <div className={cn('group relative h-14', className)}>
      {/* The visible label, before the fieldset in DOM order so text-based
          queries (the gate, assistive tech) find it first. */}
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
      {children(labelId)}
    </div>
  );
}

/**
 * MUI's outlined TextField on the OutlinedField shell: the input carries
 * MUI's input text (16px on a 23px line box, the 56px height split
 * 16.5px padding + 23px + 16.5px), the unit rides at the input's end, and
 * the helper line sits in flow under the field like MUI's FormHelperText
 * (3px margin, 12px/1.66 caption) — so an always-on helper keeps the
 * FormControl's height, and an error helper reflows the content below
 * exactly the way MUI's did. min/max/step/readOnly pass straight through
 * to the input via props.
 */
export function LabeledField({
  label,
  unit,
  error = false,
  helperText,
  className,
  ...props
}: Omit<React.ComponentProps<'input'>, 'className'> & {
  label: string;
  /** The input's end adornment, MUI's InputAdornment ('grams', '%'…). */
  unit?: string;
  error?: boolean;
  /** The line under the field; only rendered when non-empty. */
  helperText?: string;
  className?: string;
}) {
  const describedBy = useId();

  return (
    // The outer div flows: the 56px field box, then the helper line under
    // it (MUI's FormControl stacked them; the wrapper's height grows with
    // the helper, which keeps an always-on helper from being overlapped).
    <div className={className}>
      <OutlinedField label={label} error={error}>
        {(labelId) => (
          <>
            <input
              aria-labelledby={labelId}
              aria-describedby={helperText ? describedBy : undefined}
              aria-invalid={error || undefined}
              className={cn(
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
          </>
        )}
      </OutlinedField>
      {helperText && (
        <span
          id={describedBy}
          className={cn(
            'mt-[3px] block px-3.5 text-xs leading-[1.66]',
            error ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {helperText}
        </span>
      )}
    </div>
  );
}
