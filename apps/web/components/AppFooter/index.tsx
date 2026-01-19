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
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Link
        href="/"
        underline="none"
        sx={{
          color: '#1A0F0A',
          fontWeight: 600,
          textShadow: '1px 1px 2px rgba(255, 255, 255, 0.3)',
          '&:hover': {
            color: '#0A3030',
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
          color: '#1A0F0A',
          fontWeight: 600,
          textShadow: '1px 1px 2px rgba(255, 255, 255, 0.3)',
          '&:hover': {
            color: '#0A3030',
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
