import ChevronRight from '@mui/icons-material/ChevronRight';
import { List, ListItem, ListItemText, Paper, Stack } from '@mui/material';
import type { ListItemTextProps } from '@mui/material/ListItemText';
import type { LinkProps } from 'next/link';
import Link from 'next/link';
import { useMemo } from 'react';
import StickyGroupHeader from '#/components/StickyGroupHeader';
import type { ListConfig } from '#/modules/lists/type';

export function LinkListItem<RouteType>({
  href,
  primary,
  secondary,
  secondaryTypographyProps,
  tertiary,
}: {
  href?: LinkProps<RouteType>['href'];
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  secondaryTypographyProps?: NonNullable<ListItemTextProps['slotProps']>['secondary'];
  tertiary?: React.ReactNode;
}) {
  const item = (
    <ListItem divider secondaryAction={href ? <ChevronRight /> : undefined}>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
      >
        <ListItemText
          primary={primary}
          secondary={secondary}
          slotProps={{ secondary: secondaryTypographyProps }}
        />
        {tertiary}
      </Stack>
    </ListItem>
  );

  return href ? <Link href={href}>{item}</Link> : item;
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
    <List>
      {groups.map(([header, groupItems], groupIndex) => {
        // Spaces would split aria-labelledby into dead id references, so the
        // header's id keeps them out.
        const headerId = `group-header-${header.replace(/\s+/g, '-')}`;

        return (
          <li key={header}>
            <List role="group" aria-labelledby={header ? headerId : undefined}>
              {header && (
                <StickyGroupHeader id={headerId} sx={{ scrollMarginTop: 64 }}>
                  {header}
                </StickyGroupHeader>
              )}
              <Paper square>
                {groupItems.map((item) => renderItem(item))}
                {footer && groupIndex === groups.length - 1 && footer}
              </Paper>
            </List>
          </li>
        );
      })}
    </List>
  );
}
