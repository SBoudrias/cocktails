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
  notched = true,
  className,
  children,
}: {
  label: string;
  error?: boolean;
  /** Whether the label sits in the border's notch. MUI shrinks the label
      up while the field is filled or focused and un-shrinks it into the
      field when it empties — 16px text at the input's own position, the
      notch closed (probed: clearing a field drops its label y 119 → 144).
      Selects always have a value, so they stay notched. */
  notched?: boolean;
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
          notched
            ? '[transform:matrix(0.75,0,0,0.75,14,-9)]'
            : // Un-shrunk: the label rides at the input's own text
              // position (16px down, 14px in), unscaled; focus shrinks it
              // back into the notch.
              'top-4 left-3.5 group-focus-within:top-0 group-focus-within:left-0 group-focus-within:[transform:matrix(0.75,0,0,0.75,14,-9)]',
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
            text on each side; when the label un-shrinks it collapses to
            nearly nothing, closing the border. */}
        <legend
          className={cn('block h-[11px] max-w-full p-0', !notched && 'max-w-[0.01px]')}
        >
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
  // MUI's notched state: the label sits in the notch while the field has
  // a value (a computed result counts; a NaN result renders as '') and
  // un-shrinks when it empties.
  const notched = String(props.value ?? '') !== '';

  return (
    // The outer div flows: the 56px field box, then the helper line under
    // it (MUI's FormControl stacked them; the wrapper's height grows with
    // the helper, which keeps an always-on helper from being overlapped).
    <div className={className}>
      <OutlinedField label={label} error={error} notched={notched}>
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
            // MUI's FormHelperText: 14px in from both edges of the field —
            // the right inset narrows the wrap box (probed on the desktop
            // error state: without it the helper un-wraps a line early).
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
