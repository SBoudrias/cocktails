'use client';

import { Link, Stack, Typography } from '@mui/material';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';

export default function AppFooter() {
  return (
    <Stack spacing={2} sx={{ py: 2 }}>
      <Stack
        direction="row"
        divider
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Link
          href="https://github.com/SBoudrias/cocktails/"
          underline="none"
          target="_blank"
          rel="noopener"
        >
          Contribute on GitHub <ArrowOutwardIcon sx={{ fontSize: 'medium' }} />
        </Link>
      </Stack>
      <Stack
        direction="row"
        divider
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography color="textSecondary">Cocktail Index</Typography>
      </Stack>
    </Stack>
  );
}
