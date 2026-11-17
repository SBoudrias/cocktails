// The app's grouped lists: a muted header above a card-colored block of
// rows split by dividers (the rows sit in plain <ul>s at the call sites).
import { cn } from 'cn';

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
