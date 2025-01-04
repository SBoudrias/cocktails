import { Metadata } from 'next';
import AppHeader from '@/components/AppHeader';
import { Suspense } from 'react';
import { List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Link from 'next/link';
import { getSearchUrl, getSourceUrl } from '@/modules/url';
import { getAllSources } from '@/modules/sources';

export const metadata: Metadata = {
  title: 'Cocktail Index',
};

export default async function HomePage() {
  const sources = await getAllSources();

  const { book: books = [], 'youtube-channel': ytChannels = [] } = Object.groupBy(
    sources,
    (source) => source.type,
  );

  return (
    <Suspense>
      <AppHeader title="Cocktail Index" />
      <List sx={{ mt: 2 }}>
        <Paper square>
          <Link href={getSearchUrl()}>
            <ListItem divider secondaryAction={<ChevronRightIcon />}>
              <ListItemText primary="All Recipes" />
            </ListItem>
          </Link>
        </Paper>
        <li>
          <ul>
            <ListSubheader>By Books</ListSubheader>
            <Paper square>
              {books.map((source) => (
                <Link href={getSourceUrl(source)} key={source.name}>
                  <ListItem divider secondaryAction={<ChevronRightIcon />}>
                    <ListItemText primary={source.name} />
                  </ListItem>
                </Link>
              ))}
            </Paper>
          </ul>
        </li>
        <li>
          <ul>
            <ListSubheader>By Youtube Channels</ListSubheader>
            <Paper square>
              {ytChannels.map((source) => (
                <Link href={getSourceUrl(source)} key={source.name}>
                  <ListItem divider secondaryAction={<ChevronRightIcon />}>
                    <ListItemText primary={source.name} />
                  </ListItem>
                </Link>
              ))}
            </Paper>
          </ul>
        </li>
      </List>
    </Suspense>
  );
}
