'use client';

import GitHubIcon from '@mui/icons-material/GitHub';
import { Stack } from '@mui/material';
import { Link as MuiLink } from '@mui/material';
import NextLink from 'next/link';
import TikiMark from '#/components/TikiMark';

export default function AppFooter() {
  return (
    <Stack
      direction="row"
      sx={{
        // The home indicator area sits over the page bottom on notched
        // phones with viewport-fit=cover; keep the footer clear of it.
        pb: 'var(--safe-area-inset-bottom)',
        py: 2,
        px: 2,
        minHeight: '350px',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}
    >
      <MuiLink
        component={NextLink}
        href="/"
        underline="none"
        sx={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 0.5 }}
      >
        <TikiMark /> Indexotica
      </MuiLink>
      <MuiLink
        href="https://github.com/SBoudrias/cocktails/"
        target="_blank"
        rel="noopener"
        underline="none"
        sx={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 0.5 }}
      >
        <GitHubIcon /> Contribute on GitHub
      </MuiLink>
    </Stack>
  );
}
