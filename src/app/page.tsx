import { Metadata } from 'next';
import AppHeader from '@/components/AppHeader';
import { Suspense } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalculatorIcon from '@mui/icons-material/Calculate';
import SearchIcon from '@mui/icons-material/Search';
import BookIcon from '@mui/icons-material/Book';
import YoutubeIcon from '@mui/icons-material/YouTube';
import Link from 'next/link';
import {
  getAuthorListUrl,
  getBarListUrl,
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
      <ListItem
        divider
        secondaryAction={
          <Stack direction="row" spacing={1}>
            <Typography color="textSecondary" component="span">
              {source.recipeAmount}
            </Typography>
            <ChevronRightIcon />
          </Stack>
        }
      >
        <ListItemText primary={source.name} />
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
            <ListItem disablePadding divider secondaryAction={<ChevronRightIcon />}>
              <ListItemButton>
                <ListItemIcon>
                  <SearchIcon />
                </ListItemIcon>
                <ListItemText primary="All Recipes" />
              </ListItemButton>
            </ListItem>
          </Link>
        </Paper>
        <li>
          <ul>
            <ListSubheader>
              <Stack direction="row" alignItems="center" gap={1}>
                <CalculatorIcon />
                Calculators
              </Stack>
            </ListSubheader>
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
          </ul>
        </li>
        <li>
          <ul>
            <ListSubheader>
              <Stack direction="row" alignItems="center" gap={1}>
                <BookIcon />
                By Books
              </Stack>
            </ListSubheader>
            <Paper square>
              {books.map((source) => (
                <SourceListItem source={source} key={source.name} />
              ))}
            </Paper>
          </ul>
        </li>
        <li>
          <ul>
            <ListSubheader>
              <Stack direction="row" alignItems="center" gap={1}>
                <YoutubeIcon />
                By Youtube Channels
              </Stack>
            </ListSubheader>
            <Paper square>
              {ytChannels.map((source) => (
                <SourceListItem source={source} key={source.name} />
              ))}
            </Paper>
          </ul>
        </li>
        <li>
          <ul>
            <ListSubheader>Other lists</ListSubheader>
            <Paper square>
              <Link href={getAuthorListUrl()}>
                <ListItem divider secondaryAction={<ChevronRightIcon />}>
                  <ListItemText primary="By Authors" />
                </ListItem>
              </Link>
              <Link href={getBarListUrl()}>
                <ListItem divider secondaryAction={<ChevronRightIcon />}>
                  <ListItemText primary="By Bars" />
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
          </ul>
        </li>
      </List>
    </Suspense>
  );
}
