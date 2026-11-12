'use client';

import { ActionIcon, Box, Group, Text } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TikiMark from '#/components/TikiMark';
import { getRecipeListUrl } from '#/modules/url';
import styles from './style.module.css';

export default function AppHeader({ title }: { title: string }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  // The brand mark is still the MUI SvgIcon the footer shares; it sizes
  // from its font size. Its button is 56px, like MUI's large IconButton
  // around a 32px icon.
  const mark = <TikiMark sx={{ fontSize: 32 }} />;

  return (
    <>
      <Box component="header" className={styles.header}>
        <Group h="100%" className={styles.bar} gap={0} wrap="nowrap">
          {isHome ? (
            <Box w={56} h={56} className={styles.homeMark}>
              {mark}
            </Box>
          ) : (
            <ActionIcon
              component={Link}
              href="/"
              aria-label="Go to home"
              variant="subtle"
              color="gray"
              size={56}
              radius="xl"
            >
              {mark}
            </ActionIcon>
          )}
          <Text flex={1} ta="center" size="xl" fw={500} lh={1.6} truncate>
            {title}
          </Text>
          <ActionIcon
            component={Link}
            href={getRecipeListUrl()}
            aria-label="Search"
            variant="subtle"
            color="gray"
            size={48}
            radius="xl"
          >
            <IconSearch />
          </ActionIcon>
        </Group>
      </Box>
      <Box h="var(--app-bar-height)" />
    </>
  );
}
