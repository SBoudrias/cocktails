'use client';

import GitHubIcon from '@mui/icons-material/GitHub';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import { Link, Stack, Typography } from '@mui/material';

export default function AppFooter() {
  return (
    <Stack
      direction="row"
      sx={{
        py: 2,
        px: 2,
        minHeight: '350px',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}
    >
      <Link
        href="/"
        underline="none"
        sx={{
          color: '#FFFFFF',
          fontWeight: 700,
          textShadow: '2px 2px 6px rgba(0, 0, 0, 0.95), 0px 0px 8px rgba(0, 0, 0, 0.8)',
          '&:hover': {
            color: '#FFD580',
          },
        }}
      >
        <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <LocalBarIcon sx={{ fontSize: 'medium' }} /> Cocktail Index
        </Typography>
      </Link>
      <Link
        href="https://github.com/SBoudrias/cocktails/"
        underline="none"
        target="_blank"
        rel="noopener"
        sx={{
          color: '#FFFFFF',
          fontWeight: 700,
          textShadow: '2px 2px 6px rgba(0, 0, 0, 0.95), 0px 0px 8px rgba(0, 0, 0, 0.8)',
          '&:hover': {
            color: '#FFD580',
          },
        }}
      >
        <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <GitHubIcon sx={{ fontSize: 'medium' }} /> Contribute on GitHub
        </Typography>
      </Link>
    </Stack>
  );
}
