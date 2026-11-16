// The app's grouped lists: a muted header above a card-colored block of
// rows split by dividers (what MUI's List + ListSubheader + Paper drew).
import { cn } from 'cn';

export function ListSubheader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'px-4 py-4 text-sm leading-[1.4rem] font-medium text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function List({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={cn(className)} {...props} />;
}

// MUI's plain ListItem row (no link, no chevron): 8px vertical padding,
// 16px sides, the bottom divider — the rows the instruction and technique
// lists draw. The 4px inner margin belongs to the caller's content span
// (MUI's ListItemText).
export function ListRow({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      className={cn(
        'flex w-full items-center border-x-0 border-t-0 border-b border-border py-2 pr-4 pl-4 text-base',
        className,
      )}
      {...props}
    />
  );
}
