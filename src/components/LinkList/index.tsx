import type { Route } from 'next';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { List, ListItem, ListItemText, ListSubheader, Paper, Stack } from '@mui/material';
import Link from 'next/link';

export function LinkListItem({
  href,
  primary,
  secondary,
  tertiary,
}: {
  href?: Route;
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

export function LinkList<T>({
  items,
  header,
  renderItem,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  header?: string;
}) {
  const headerId = header ? `group-header-${header}` : undefined;

  return (
    <List role={header ? 'group' : undefined} aria-labelledby={headerId}>
      {header && <ListSubheader id={headerId}>{header}</ListSubheader>}
      <Paper square>{items.map((item) => renderItem(item))}</Paper>
    </List>
  );
}
