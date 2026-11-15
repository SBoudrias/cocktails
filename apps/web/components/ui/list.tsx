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
