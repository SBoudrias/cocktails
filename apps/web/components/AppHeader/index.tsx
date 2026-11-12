'use client';

import { ActionIcon, Box, Group, Text } from '@mantine/core';
import { IconGlassCocktail, IconSearch } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getRecipeListUrl } from '#/modules/url';
import styles from './style.module.css';

export default function AppHeader({ title }: { title: string }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <>
      <Box component="header" className={styles.header}>
        <Group h="100%" px="xs" gap={0} wrap="nowrap">
          {isHome ? (
            <Box w={48} />
          ) : (
            <ActionIcon
              component={Link}
              href="/"
              aria-label="Go to home"
              variant="subtle"
              color="gray"
              size={48}
              radius="xl"
            >
              <IconGlassCocktail />
            </ActionIcon>
          )}
          <Text flex={1} ta="center" size="xl" fw={500} truncate>
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
