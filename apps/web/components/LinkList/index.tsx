import ChevronRight from '@mui/icons-material/ChevronRight';
import { List, ListItem, ListItemText, Paper, Stack } from '@mui/material';
import type { ListItemTextProps } from '@mui/material/ListItemText';
import type { LinkProps } from 'next/link';
import Link from 'next/link';
import { useId, useMemo } from 'react';
import StickyGroupHeader from '#/components/StickyGroupHeader';
import type { ListConfig } from '#/modules/lists/type';

// A group is the scroll-jump target rather than its sticky subheader: a stuck
// subheader reports its stuck position, so jumping to the current group would
// not reach its start. The margin keeps the group clear of the fixed app bar
// (56px toolbar + 8px). A plain style: LinkList also renders on the server,
// where MUI's styled() is unavailable
const groupStyle = { scrollMarginTop: 64 };

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
    // Defaults hoisted out of the destructuring: React Compiler can't lower
    // arrow functions inside a destructuring pattern's defaults
    const groupByAll = (): string => header;
    const sortHeaderAlphabetically = (a: string, b: string) => a.localeCompare(b);
    const {
      groupBy = groupByAll,
      sortItemBy = () => 0,
      sortHeaderBy = sortHeaderAlphabetically,
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

  // Headers can hold spaces (chapter names), so ids come from the group's
  // position: aria-labelledby is a space-separated id list
  const idPrefix = useId();

  return (
    <List>
      {groups.map(([header, groupItems], position) => {
        const headerId = `${idPrefix}-group-${position}`;

        return (
          <li key={header} data-header={header || undefined} style={groupStyle}>
            <List role="group" aria-labelledby={header ? headerId : undefined}>
              {header && <StickyGroupHeader id={headerId}>{header}</StickyGroupHeader>}
              <Paper square>
                {groupItems.map((item) => renderItem(item))}
                {footer && position === groups.length - 1 && footer}
              </Paper>
            </List>
          </li>
        );
      })}
    </List>
  );
}
