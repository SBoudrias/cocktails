import ChevronRight from '@mui/icons-material/ChevronRight';
import { List, ListItem, ListItemText, ListSubheader, Paper, Stack } from '@mui/material';
import Link from 'next/link';

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
} & (
  | { header?: string; groupBy?: never }
  | { header?: never; groupBy: (item: T) => string }
);

export function LinkList<T>({ items, header, groupBy, renderItem }: LinkListProps<T>) {
  // When groupBy is provided, group items and render nested LinkLists
  if (groupBy) {
    const groups = Object.entries(Object.groupBy(items, groupBy)).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    return (
      <List>
        {groups.map(([groupKey, groupItems]) => {
          if (!groupItems) return null;

          return (
            <li key={groupKey}>
              <LinkList items={groupItems} header={groupKey} renderItem={renderItem} />
            </li>
          );
        })}
      </List>
    );
  }

  // When header is provided (or no groupBy), render flat list
  const headerId = header ? `group-header-${header}` : undefined;

  return (
    <List role={header ? 'group' : undefined} aria-labelledby={headerId}>
      {header && <ListSubheader id={headerId}>{header}</ListSubheader>}
      <Paper square>{items.map((item) => renderItem(item))}</Paper>
    </List>
  );
}
