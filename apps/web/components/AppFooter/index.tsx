'use client';

import GitHubIcon from '@mui/icons-material/GitHub';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import { Button, Stack } from '@mui/material';

const buttonSx = {
  color: '#FFFFFF',
  fontWeight: 700,
  backgroundColor: 'rgba(10, 20, 32, 0.7)',
  backdropFilter: 'blur(4px)',
  '&:hover': {
    color: '#FFD580',
    backgroundColor: 'rgba(10, 20, 32, 0.85)',
  },
};

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
      <Button href="/" startIcon={<LocalBarIcon />} sx={buttonSx}>
        Cocktail Index
      </Button>
      <Button
        href="https://github.com/SBoudrias/cocktails/"
        target="_blank"
        rel="noopener"
        startIcon={<GitHubIcon />}
        sx={buttonSx}
      >
        Contribute on GitHub
      </Button>
    </Stack>
  );
}
