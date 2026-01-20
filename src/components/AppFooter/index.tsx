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
          backgroundColor: 'rgba(10, 20, 32, 0.7)',
          px: 2,
          py: 1.5,
          borderRadius: 2,
          backdropFilter: 'blur(4px)',
          '&:hover': {
            color: '#FFD580',
            backgroundColor: 'rgba(10, 20, 32, 0.85)',
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
          backgroundColor: 'rgba(10, 20, 32, 0.7)',
          px: 2,
          py: 1.5,
          borderRadius: 2,
          backdropFilter: 'blur(4px)',
          '&:hover': {
            color: '#FFD580',
            backgroundColor: 'rgba(10, 20, 32, 0.85)',
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
