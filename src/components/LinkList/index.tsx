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

type LinkListProps<T> = {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  groupBy?: (item: T) => string;
  header?: string;
};

export function LinkList<T>({ items, groupBy, header, renderItem }: LinkListProps<T>) {
  const groups = useMemo(() => {
    if (!groupBy && !header) {
      // No grouping - return single group with empty key
      return [['', items] as const];
    }

    // Use the provided groupBy function, or group everything under the header
    const groupFn = groupBy ?? (() => header ?? '');
    const groupedItems = Object.groupBy(items, groupFn);
    return Object.entries(groupedItems).toSorted(([a], [b]) => a.localeCompare(b));
  }, [items, groupBy, header]);

  // If there's only one group with no header, render a simple flat list
  const firstGroup = groups[0];
  if (groups.length === 1 && firstGroup && firstGroup[0] === '') {
    return (
      <List>
        <Paper square>{items.map((item) => renderItem(item))}</Paper>
      </List>
    );
  }

  // Otherwise, render groups with headers
  return (
    <List>
      {groups.map(([groupKey, groupItems]) => {
        if (!groupItems) return null;

        const headerId = `group-header-${groupKey}`;

        return (
          <li key={groupKey}>
            <List role="group" aria-labelledby={headerId}>
              <ListSubheader id={headerId}>{groupKey}</ListSubheader>
              <Paper square>{groupItems.map((item) => renderItem(item))}</Paper>
            </List>
          </li>
        );
      })}
    </List>
  );
}
