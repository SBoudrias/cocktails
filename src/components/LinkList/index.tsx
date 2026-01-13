import Link from 'next/link';
import { List, ListItem, ListItemText, ListSubheader, Paper, Stack } from '@mui/material';
import ChevronRight from '@mui/icons-material/ChevronRight';

export function LinkListItem({
  href,
  primary,
  secondary,
  tertiary,
}: {
  href: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  tertiary?: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <ListItem divider secondaryAction={<ChevronRight />}>
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
    </Link>
  );
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
