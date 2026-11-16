// The app's grouped lists: a muted header above a card-colored block of
// rows split by dividers (what MUI's ListSubheader drew; the rows sit in
// plain <ul>s at the call sites).
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
