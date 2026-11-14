import { cn } from 'cn';
import { ChevronRight } from 'lucide-react';
import type { LinkProps } from 'next/link';
import Link from 'next/link';

// The app's grouped lists: a muted header above a card-colored block of
// rows split by dividers (what MUI's List + ListSubheader + Paper drew).

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
  return <ul className={cn('bg-card', className)} {...props} />;
}

export function ListRow<RouteType>({
  href,
  children,
  className,
}: {
  href?: LinkProps<RouteType>['href'];
  children: React.ReactNode;
  className?: string;
}) {
  // MUI ListItem metrics (8px padding + ListItemText's 4px margins), and
  // capitalized like every ListItemText in the app's theme.
  const rowClass = cn(
    'flex w-full items-center gap-2.5 rounded-none border-x-0 border-t-0 border-b-border px-4 py-3 text-base capitalize outline-none transition-colors duration-100 [a]:hover:bg-muted focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
    className,
  );

  return (
    <li>
      {href ? (
        <Link href={href} className={rowClass}>
          <span className="flex flex-1 flex-col gap-1 text-left">{children}</span>
          <ChevronRight className="size-6 shrink-0 text-foreground" />
        </Link>
      ) : (
        <div className={rowClass}>
          <span className="flex flex-1 flex-col gap-1">{children}</span>
        </div>
      )}
    </li>
  );
}
