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
        'animate-skeleton bg-foreground/13 block scale-y-60 origin-[0 55%] rounded-[4px/6.7px]',
        className,
      )}
      {...props}
    >
      {'\u00A0'}
    </span>
  );
}
