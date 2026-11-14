'use client';

import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import SearchInput from '#/components/SearchInput';
import TikiMark from '#/components/TikiMark';
import { preloadSearchIndex } from '#/modules/searchIndex';

export default function SearchHeader({
  title,
  searchTerm,
  onSearchChange,
  underTitle,
}: {
  title?: string;
  searchTerm: string | null;
  onSearchChange: (value: string | null) => void;
  /** Rendered directly under the page title, hidden while a search is active. */
  underTitle?: ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <>
      <AppBar>
        <Toolbar>
          {isHome ? (
            <IconButton size="large" edge="start" disabled>
              <TikiMark size={32} />
            </IconButton>
          ) : (
            <IconButton size="large" edge="start" aria-label="Go to home" href="/">
              <TikiMark size={32} />
            </IconButton>
          )}

          {/* Searches beyond names need the shared index: start loading it as
              soon as the user reaches for the search box. */}
          <SearchInput
            value={searchTerm ?? ''}
            onChangeAction={onSearchChange}
            onFocusAction={preloadSearchIndex}
          />
        </Toolbar>
      </AppBar>
      <Toolbar />
      {!searchTerm && title && (
        <Typography variant="h5" component="h1" sx={{ mx: 2, my: 1 }}>
          {title}
        </Typography>
      )}
      {!searchTerm && underTitle}
    </>
  );
}
