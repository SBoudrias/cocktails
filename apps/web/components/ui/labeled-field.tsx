'use client';

import { cn } from 'cn';
import { useId } from 'react';

/**
 * The outlined-field shell: the fieldset is the outline, absolutely
 * positioned 5px above the field so its top border rides above the input's
 * box; the legend inside it is an invisible sizer (11px tall, its span 12px
 * + 5px side padding) that holds the border open around the label; the
 * visible label is a separate span — 16px/23px text under a 0.75 scale
 * transform that shifts it into the notch (the literal matrix so the
 * rasterization matches). Focus thickens the border to 2px and colors the
 * label (the `group` here is what the group-focus-within variants hang on);
 * errors color border and label.
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
  /** Whether the label sits in the border's notch. The label shrinks up
      while the field is filled or focused and un-shrinks into the field
      when it empties — 16px text at the input's own position, the notch
      closed. Selects always have a value, so they stay notched. */
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
          'absolute top-0 left-0 origin-top-left text-base leading-5.75 whitespace-nowrap',
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
          'pointer-events-none absolute inset-x-0 -top-1.25 bottom-0 m-0 overflow-hidden rounded-sm border border-input px-2',
          'group-focus-within:border-2 group-focus-within:border-primary',
          error && 'border-destructive group-focus-within:border-destructive',
        )}
      >
        {/* The invisible sizer: its width is the notch. The gap stays 5px
            wider than the text on each side; when the label un-shrinks it
            collapses to nearly nothing, closing the border. */}
        <legend
          className={cn('block h-2.75 max-w-full p-0', !notched && 'max-w-[0.01px]')}
        >
          <span
            aria-hidden="true"
            className="block px-1.25 text-xs leading-5.75 whitespace-nowrap opacity-0"
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
 * An outlined text field on the OutlinedField shell: the input carries
 * 16px text on a 23px line box (the 56px height split 16.5px padding +
 * 23px + 16.5px), the unit rides at the input's end, and the helper line
 * sits in flow under the field (3px margin, 12px/1.66 caption) — an
 * always-on helper keeps the field's height, and an error helper reflows
 * the content below. min/max/step/readOnly pass straight through to the
 * input via props.
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
  /** The input's end adornment ('grams', '%'…). */
  unit?: string;
  error?: boolean;
  /** The line under the field; only rendered when non-empty. */
  helperText?: string;
  className?: string;
}) {
  const describedBy = useId();
  // Notched while the field has a value (a computed result counts; a NaN
  // result renders as ''), un-shrinks when it empties.
  const notched = String(props.value ?? '') !== '';

  return (
    // The outer div flows: the 56px field box, then the helper line under
    // it (the wrapper's height grows with the helper, which keeps an
    // always-on helper from being overlapped).
    <div className={className}>
      <OutlinedField label={label} error={error} notched={notched}>
        {(labelId) => (
          <>
            <input
              aria-labelledby={labelId}
              aria-describedby={helperText ? describedBy : undefined}
              aria-invalid={error || undefined}
              className={cn(
                'peer h-14 w-full rounded-sm bg-transparent px-3.5 text-base leading-5.75 outline-none',
                unit && 'pr-14',
              )}
              {...props}
            />
            {unit && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-base text-muted-foreground"
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
            // The helper line: 14px in from both edges of the field — the
            // right inset narrows the wrap box (without it the helper
            // un-wraps a line early).
            'mt-0.75 block px-3.5 text-xs leading-[1.66]',
            error ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {helperText}
        </span>
      )}
    </div>
  );
}
