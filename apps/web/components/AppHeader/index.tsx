'use client';

import { LocalBar, Search } from '@mui/icons-material';
import { AppBar, Box, Icon, IconButton, Toolbar, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';
import { getRecipeListUrl } from '#/modules/url';

export default function AppHeader({ title }: { title: string }) {
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
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1, flexShrink: 1, textAlign: 'center' }}
            >
              {title}
            </Typography>
            <IconButton
              size="large"
              edge="end"
              aria-label="Search"
              href={getRecipeListUrl()}
            >
              <Search />
            </IconButton>
          </Toolbar>
        </Box>
      </AppBar>
      <Toolbar />
    </>
  );
}
