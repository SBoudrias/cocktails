'use client';

import { ChevronLeft, Search, Close } from '@mui/icons-material';
import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import SearchInput from '@/components/SearchInput';

export default function SearchHeader({
  title,
  searchTerm,
  onSearchChange,
}: {
  title: string;
  searchTerm: string | null;
  onSearchChange: (value: string | null) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';
  const isSearchActive = searchTerm !== null;

  return (
    <>
      <AppBar>
        <Toolbar>
          {isHome ? (
            <IconButton size="large" edge="start" disabled>
              <ChevronLeft sx={{ visibility: 'hidden' }} />
            </IconButton>
          ) : (
            <IconButton
              size="large"
              edge="start"
              aria-label="Go back"
              onClick={() => router.back()}
            >
              <ChevronLeft />
            </IconButton>
          )}

          {isSearchActive ? (
            <SearchInput value={searchTerm} onChangeAction={onSearchChange} autoFocus />
          ) : (
            <Typography
              variant="h6"
              noWrap
              component="div"
              textAlign="center"
              sx={{ flexGrow: 1, flexShrink: 1 }}
            >
              {title}
            </Typography>
          )}

          {isSearchActive ? (
            <IconButton
              size="large"
              edge="end"
              aria-label="Close search"
              onClick={() => onSearchChange(null)}
            >
              <Close />
            </IconButton>
          ) : (
            <IconButton
              size="large"
              edge="end"
              aria-label="Search"
              onClick={() => onSearchChange('')}
            >
              <Search />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>
      <Toolbar />
    </>
  );
}
