import type { Metadata } from 'next';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { List, ListItem, ListItemText, Paper } from '@mui/material';
import Link from 'next/link';
import { Suspense } from 'react';
import AppHeader from '@/components/AppHeader';

export const metadata: Metadata = {
  title: 'Cocktail Index | Calculators',
};

export default async function CalculatorsPage() {
  return (
    <Suspense>
      <AppHeader title="Calculators" />
      <List sx={{ mt: 2 }}>
        <Paper square>
          <Link href={'/calculators/acid-adjusting'}>
            <ListItem divider secondaryAction={<ChevronRightIcon />}>
              <ListItemText primary="Acid Adjusting" />
            </ListItem>
          </Link>
          <Link href={'/calculators/brix'}>
            <ListItem divider secondaryAction={<ChevronRightIcon />}>
              <ListItemText primary="Sugar Adjusting (Brix calculator)" />
            </ListItem>
          </Link>
          <Link href={'/calculators/saline'}>
            <ListItem divider secondaryAction={<ChevronRightIcon />}>
              <ListItemText primary="Saline Solution Calculator" />
            </ListItem>
          </Link>
        </Paper>
      </List>
    </Suspense>
  );
}
