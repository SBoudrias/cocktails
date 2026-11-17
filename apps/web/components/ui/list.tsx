// The app's grouped lists: a muted header above a card-colored block of
// rows split by dividers (the rows sit in plain <ul>s at the call sites).
import { cn } from 'cn';

// The ul the app's grouped lists render: vertical padding around the
// surface block of rows. Extra classes (mt-4, pt-2 pb-4) and aria
// attributes pass through to the underlying element.
export function List({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={cn('py-2', className)} {...props} />;
}

export function ListSubheader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'p-4 text-sm leading-[1.4rem] font-medium text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

// A plain row (no link, no chevron): 8px vertical padding, 16px sides, the
// bottom divider — the rows the instruction and technique lists draw. The
// 4px inner margin belongs to the caller's content span.
export function ListRow({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      className={cn('flex w-full items-center border-b px-4 py-2 text-base', className)}
      {...props}
    />
  );
}
