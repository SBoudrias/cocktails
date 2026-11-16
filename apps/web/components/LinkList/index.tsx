import { cn } from 'cn';
import { ChevronRight } from 'lucide-react';
import type { LinkProps } from 'next/link';
import Link from 'next/link';
import { useMemo } from 'react';
import StickyGroupHeader from '#/components/StickyGroupHeader';
import type { ListConfig } from '#/modules/lists/type';

// The secondary line's metrics, MUI's caption with the 1.35 line height the
// app passed in slotProps: 12px, muted teal.
const secondaryClass = 'text-xs leading-[1.35] text-muted-foreground';

export function LinkListItem<RouteType>({
  href,
  leading,
  primary,
  secondary,
  tertiary,
  count,
}: {
  href?: LinkProps<RouteType>['href'];
  /** Leading icon, MUI's ListItemIcon slot (sized by the caller). */
  leading?: React.ReactNode;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  tertiary?: React.ReactNode;
  /** Muted trailing count — the recipe-count tertiary every list draws. */
  count?: number;
}) {
  // MUI ListItem metrics: 8px padding + ListItemText's 4px margins, with
  // the chevron MUI's secondaryAction drew.
  // MUI ListItem metrics: 8px padding + ListItemText's 4px margins; the
  // chevron is the secondaryAction — absolutely positioned at the right, the
  // row reserving its 56px so text wraps exactly where MUI's did.
  const rowClass = cn(
    'relative flex w-full items-center rounded-none border-x-0 border-t-0 border-b px-4 py-3 text-base outline-none transition-colors duration-100 [a]:hover:bg-muted focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
    href && 'pr-12',
  );

  const content = (
    <>
      {leading && <span className="flex min-w-9 shrink-0 items-center">{leading}</span>}
      <span className="flex min-w-0 flex-1 flex-col gap-1 text-left">
        <span className="min-w-0">{primary}</span>
        {secondary && <span className={secondaryClass}>{secondary}</span>}
      </span>
      {tertiary && <span className="shrink-0">{tertiary}</span>}
      {count != null && <span className="shrink-0 text-muted-foreground">{count}</span>}
      {href && (
        <ChevronRight className="absolute top-1/2 right-4 size-6 -translate-y-1/2 text-foreground" />
      )}
    </>
  );

  return (
    <li>
      {href ? (
        <Link href={href} className={rowClass}>
          {content}
        </Link>
      ) : (
        <div className={rowClass}>{content}</div>
      )}
    </li>
  );
}

export function LinkList<const T>({
  items,
  renderItem,
  config,
  header = '',
  footer,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  config?: ListConfig<T>;
  header?: string;
  /** Rendered after the last group's items, inside its paper. */
  footer?: React.ReactNode;
}) {
  const groups = useMemo(() => {
    const {
      groupBy = () => header,
      sortItemBy = () => 0,
      sortHeaderBy = (a: string, b: string) => a.localeCompare(b),
    } = config ?? {};

    const groupedItems = Object.groupBy(items, groupBy);

    return (
      Object.entries(groupedItems)
        // Sort items within each group
        .map(([header, items = []]): [string, T[]] => [
          header,
          items.toSorted(sortItemBy),
        ])
        // Sort the groups by their headers
        .toSorted(([a], [b]) => sortHeaderBy(a, b))
    );
  }, [items, config, header]);

  return (
    <ul className="py-2">
      {groups.map(([header, groupItems], groupIndex) => {
        // Spaces would split aria-labelledby into dead id references, so the
        // header's id keeps them out.
        const headerId = `group-header-${header.replace(/\s+/g, '-')}`;

        return (
          <li key={header}>
            <ul
              role="group"
              aria-labelledby={header ? headerId : undefined}
              className="py-2"
            >
              {header && <StickyGroupHeader id={headerId}>{header}</StickyGroupHeader>}
              <div className="bg-card">
                {groupItems.map((item) => renderItem(item))}
                {footer && groupIndex === groups.length - 1 && footer}
              </div>
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
