'use client';

import { getSearchUrl } from '@/modules/url';
import { ChevronLeft, Search } from '@mui/icons-material';
import { AppBar, Icon, IconButton, Toolbar, Typography } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';

export default function AppHeader({ title }: { title: string }) {
  const pathname = usePathname();
  const router = useRouter();
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
            <IconButton
              size="large"
              edge="start"
              aria-label="Go back"
              onClick={() => router.back()}
            >
              <ChevronLeft />
            </IconButton>
          )}
          <Typography
            variant="h6"
            noWrap
            component="div"
            textAlign="center"
            sx={{ flexGrow: 1, flexShrink: 1 }}
          >
            {title}
          </Typography>
          <IconButton size="large" edge="end" aria-label="Search" href={getSearchUrl()}>
            <Search />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </>
  );
}
