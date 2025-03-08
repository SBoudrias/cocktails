import { Metadata } from 'next';
import AppHeader from '@/components/AppHeader';
import { Suspense } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Link from 'next/link';
import {
  getBottleListUrl,
  getIngredientListUrl,
  getSearchUrl,
  getSourceUrl,
} from '@/modules/url';
import { getAllSources } from '@/modules/sources';
import { Source } from '@/types/Source';

export const metadata: Metadata = {
  title: 'Cocktail Index',
};

function SourceListItem({ source }: { source: Source }) {
  return (
    <Link href={getSourceUrl(source)} key={source.name}>
      <ListItem divider secondaryAction={<ChevronRightIcon />}>
        <ListItemText>
          <Stack direction="row" justifyContent="space-between">
            <span>{source.name}</span>
            <Typography color="textSecondary" component="span">
              {source.recipeAmount}
            </Typography>
          </Stack>
        </ListItemText>
      </ListItem>
    </Link>
  );
}

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
          <Link href={getIngredientListUrl()}>
            <ListItem divider secondaryAction={<ChevronRightIcon />}>
              <ListItemText primary="All Ingredients" />
            </ListItem>
          </Link>
          <Link href={getBottleListUrl()}>
            <ListItem divider secondaryAction={<ChevronRightIcon />}>
              <ListItemText primary="All Bottles" />
            </ListItem>
          </Link>
        </Paper>
        <li>
          <ul>
            <ListSubheader>By Books</ListSubheader>
            <Paper square>
              {books.map((source) => (
                <SourceListItem source={source} key={source.name} />
              ))}
            </Paper>
          </ul>
        </li>
        <li>
          <ul>
            <ListSubheader>By Youtube Channels</ListSubheader>
            <Paper square>
              {ytChannels.map((source) => (
                <SourceListItem source={source} key={source.name} />
              ))}
            </Paper>
          </ul>
        </li>
      </List>
    </Suspense>
  );
}
