'use client';

import { Divider, Link, Stack, Typography } from '@mui/material';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import HomeIcon from '@mui/icons-material/Home';

export default function AppFooter() {
  return (
    <Stack spacing={2} sx={{ py: 2 }}>
      <Stack
        direction="row"
        divider={<Divider orientation="vertical" flexItem />}
        spacing={2}
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
        <Link href="/" underline="none">
          <Typography color="textSecondary">
            <HomeIcon sx={{ fontSize: 'medium' }} /> Cocktail Index
          </Typography>
        </Link>
      </Stack>
    </Stack>
  );
}
