'use client';

import GitHubIcon from '@mui/icons-material/GitHub';
import { Link, Stack } from '@mui/material';
import TikiMark from '#/components/TikiMark';

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
        sx={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 0.5 }}
      >
        <TikiMark /> Indexotica
      </Link>
      <Link
        href="https://github.com/SBoudrias/cocktails/"
        target="_blank"
        rel="noopener"
        underline="none"
        sx={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 0.5 }}
      >
        <GitHubIcon /> Contribute on GitHub
      </Link>
    </Stack>
  );
}
