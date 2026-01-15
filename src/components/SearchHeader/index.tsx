'use client';

import { ChevronLeft } from '@mui/icons-material';
import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import SearchInput from '@/components/SearchInput';

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
  const router = useRouter();
  const isHome = pathname === '/';

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
