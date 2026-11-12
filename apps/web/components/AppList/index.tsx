'use client';

import { NavLink, Paper, Text } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import type { LinkProps } from 'next/link';
import Link from 'next/link';
import styles from './style.module.css';

// The app's grouped lists: a dimmed header above a paper block of rows
// split by dividers (what MUI's List + ListSubheader + Paper drew). A client
// module: NavLink renders next/link through its `renderRoot` prop, and a
// function prop cannot cross from a server component.

export function ListSubheader({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <Text
      id={id}
      size="sm"
      fw={500}
      c="dimmed"
      component="div"
      className={styles.subheader}
    >
      {children}
    </Text>
  );
}

export function List({
  children,
  ...props
}: {
  children: React.ReactNode;
  'aria-labelledby'?: string;
}) {
  return (
    <Paper component="ul" radius={0} className={styles.list} {...props}>
      {children}
    </Paper>
  );
}

export function ListRow<RouteType>({
  href,
  children,
}: {
  href?: LinkProps<RouteType>['href'];
  children: React.ReactNode;
}) {
  return (
    <li className={styles.row}>
      {href ? (
        <NavLink
          renderRoot={(props) => <Link href={href} {...props} />}
          label={children}
          rightSection={<IconChevronRight size={24} />}
          classNames={{ root: styles.link, label: styles.label }}
        />
      ) : (
        <div className={styles.static}>{children}</div>
      )}
    </li>
  );
}
