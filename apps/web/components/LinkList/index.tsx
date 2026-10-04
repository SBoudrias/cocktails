import ChevronRight from '@mui/icons-material/ChevronRight';
import { List, ListItem, ListItemText, ListSubheader, Paper, Stack } from '@mui/material';
import type { ListItemTextProps } from '@mui/material/ListItemText';
import type { ListSubheaderProps } from '@mui/material/ListSubheader';
import slugify from '@sindresorhus/slugify';
import type { LinkProps } from 'next/link';
import Link from 'next/link';
import { useCallback, useId, useMemo } from 'react';
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
  onHeaderMount,
  headerSx,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  config?: ListConfig<T>;
  header?: string;
  onHeaderMount?: (header: string, node: HTMLElement) => void;
  headerSx?: ListSubheaderProps['sx'];
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

  // Stable across re-renders while onHeaderMount is stable: avoids ref
  // detach/reattach churn. Unmounts can't identify their header from a null
  // node, so the consumer prunes stale entries when the group set changes
  const headerRef = useCallback(
    (node: HTMLElement | null) => {
      if (node) onHeaderMount?.(node.dataset.header ?? '', node);
    },
    [onHeaderMount],
  );

  const headerIdPrefix = `group-header-${useId().replace(/[^a-zA-Z0-9-]/g, '')}-`;

  return (
    <List>
      {groups.map(([header, groupItems]) => (
        <li key={header}>
          <List
            role="group"
            aria-labelledby={header ? `${headerIdPrefix}${slugify(header)}` : undefined}
          >
            {header && (
              <ListSubheader
                ref={headerRef}
                data-header={header}
                id={`${headerIdPrefix}${slugify(header)}`}
                sx={headerSx}
              >
                {header}
              </ListSubheader>
            )}
            <Paper square>{groupItems.map((item) => renderItem(item))}</Paper>
          </List>
        </li>
      ))}
    </List>
  );
}
