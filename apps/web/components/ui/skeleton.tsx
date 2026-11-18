import { cn } from 'cn';

// A text-line skeleton: a block scaled to 60% height about the 55% mark of
// its origin (the visual line height stays the text's) with a shallow
// elliptical radius. Width comes from utilities the caller passes
// (w-[55%], w-11). The non-breaking space child keeps the line's height —
// an empty span collapses to zero.
export function Skeleton({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        // motion-reduce: the pulse stops under prefers-reduced-motion, the
        // static block remaining.
        'block origin-[0_55%] scale-y-60 animate-skeleton rounded-[4px/6.7px] bg-foreground/13 motion-reduce:animate-none',
        className,
      )}
      {...props}
    >
      {'\u00A0'}
    </span>
  );
}
