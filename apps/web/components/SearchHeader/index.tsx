'use client';

import SearchInput from '#/components/SearchInput';
import { Home } from '@mui/icons-material';
import { AppBar, Icon, IconButton, Toolbar, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';

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
              <Icon />
            </IconButton>
          ) : (
            <IconButton size="large" edge="start" aria-label="Go to home" href="/">
              <Home />
            </IconButton>
          )}

          <SearchInput value={searchTerm ?? ''} onChangeAction={onSearchChange} />
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
