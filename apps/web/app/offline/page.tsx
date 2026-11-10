import { LocalBar } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import type { Metadata } from 'next';
import Link from 'next/link';
import AppHeader from '#/components/AppHeader';

export const metadata: Metadata = {
  title: 'Offline | Cocktail Index',
};

/**
 * The offline fallback the service worker serves for navigations that are
 * neither reachable nor cached. Kept free of client JS so it renders with
 * nothing precached beyond the shell.
 */
export default function OfflinePage() {
  return (
    <>
      <AppHeader title="Cocktail Index" />
      <Box
        component="main"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          pt: 8,
          px: 2,
          textAlign: 'center',
        }}
      >
        <LocalBar sx={{ fontSize: 64, opacity: 0.5 }} />
        <Typography variant="h5" component="h1">
          You are offline
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420 }}>
          This page is not available without a connection, and you have not visited it
          before. Pages you have opened recently still work offline.
        </Typography>
        <Link href="/list/recipes" style={{ textDecoration: 'none' }}>
          <Typography variant="body1" color="primary">
            Go to all recipes
          </Typography>
        </Link>
      </Box>
    </>
  );
}
