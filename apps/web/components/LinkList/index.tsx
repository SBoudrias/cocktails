import type { ListConfig } from '#/modules/lists/type';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { List, ListItem, ListItemText, ListSubheader, Paper, Stack } from '@mui/material';
import Link from 'next/link';
import { useMemo } from 'react';

export function LinkListItem({
  href,
  primary,
  secondary,
  tertiary,
}: {
  href?: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  tertiary?: React.ReactNode;
}) {
  const item = (
    <ListItem divider secondaryAction={href ? <ChevronRight /> : undefined}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
      >
        <ListItemText primary={primary} secondary={secondary} />
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
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  config?: ListConfig<T>;
  header?: string;
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
      {groups.map(([header, groupItems]) => {
        const headerId = `group-header-${header}`;

        return (
          <li key={header}>
            <List role="group" aria-labelledby={header ? headerId : undefined}>
              {header && <ListSubheader id={headerId}>{header}</ListSubheader>}
              <Paper square>{groupItems.map((item) => renderItem(item))}</Paper>
            </List>
          </li>
        );
      })}
    </List>
  );
}
