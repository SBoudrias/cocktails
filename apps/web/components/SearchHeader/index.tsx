'use client';

import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';
import SearchInput from '#/components/SearchInput';
import TikiMark from '#/components/TikiMark';
import { preloadSearchIndex } from '#/modules/searchIndex';

export default function SearchHeader({
  title,
  searchTerm,
  onSearchChange,
}: {
  title?: string;
  searchTerm: string | null;
  onSearchChange: (value: string | null) => void;
}) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <>
      <AppBar>
        <Toolbar>
          {isHome ? (
            <IconButton size="large" edge="start" disabled>
              <TikiMark sx={{ fontSize: 32 }} />
            </IconButton>
          ) : (
            <IconButton size="large" edge="start" aria-label="Go to home" href="/">
              <TikiMark sx={{ fontSize: 32 }} />
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
    </>
  );
}
