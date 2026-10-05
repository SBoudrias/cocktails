'use client';

import { LocalBar } from '@mui/icons-material';
import { AppBar, Box, Icon, IconButton, Toolbar, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';
import SearchInput from '#/components/SearchInput';

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
        <Box
          sx={{ width: '100%', maxWidth: { md: 1200 }, mx: 'auto', pl: { md: '272px' } }}
        >
          <Toolbar sx={{ width: '100%', maxWidth: { md: 720 }, mx: 'auto' }}>
            {isHome ? (
              <IconButton size="large" edge="start" disabled>
                <Icon />
              </IconButton>
            ) : (
              <IconButton size="large" edge="start" aria-label="Go to home" href="/">
                <LocalBar />
              </IconButton>
            )}

            <Typography
              variant="body2"
              sx={{ display: { xs: 'none', md: 'block' }, mr: 1, whiteSpace: 'nowrap' }}
            >
              {title === 'All Recipes' ? 'All recipes' : 'Filter this page'}
            </Typography>
            <SearchInput
              ariaLabel={
                title === 'All Recipes' ? 'Search all recipes' : 'Filter this page'
              }
              value={searchTerm ?? ''}
              onChangeAction={onSearchChange}
            />
          </Toolbar>
        </Box>
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
