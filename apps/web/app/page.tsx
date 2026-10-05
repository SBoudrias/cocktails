import type { Source } from '@cocktails/data';
import { getRecentlyAddedRecipes } from '@cocktails/data/recipes';
import { getAllSources } from '@cocktails/data/sources';
import BookIcon from '@mui/icons-material/Book';
import CalculatorIcon from '@mui/icons-material/Calculate';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HistoryIcon from '@mui/icons-material/History';
import PodcastIcon from '@mui/icons-material/Podcasts';
import SearchIcon from '@mui/icons-material/Search';
import YoutubeIcon from '@mui/icons-material/YouTube';
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
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import AppHeader from '#/components/AppHeader';
import {
  getAuthorListUrl,
  getBarListUrl,
  getBottleListUrl,
  getIngredientListUrl,
  getNonAlcoholicRecipeListUrl,
  getRecentlyAddedUrl,
  getRecipeListUrl,
  getSourceUrl,
} from '#/modules/url';

export const metadata: Metadata = {
  title: 'Cocktail Index',
};

function SourceListItem({ source }: { source: Source }) {
  return (
    <Link href={getSourceUrl(source)} key={source.name}>
      <ListItem
        divider
        sx={{ pr: { md: 2 } }}
        secondaryAction={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
            <Typography color="textSecondary" component="span">
              {source.recipeAmount}
            </Typography>
            <ChevronRightIcon />
          </Stack>
        }
        // Keep the original mobile geometry. On desktop the secondary action
        // becomes an in-flow flex column, so full names can wrap beside counts.
        slotProps={{
          secondaryAction: {
            sx: {
              position: { md: 'static' },
              transform: { md: 'none' },
              flexShrink: 0,
              ml: { md: 1 },
            },
          },
        }}
      >
        <ListItemText
          primary={source.name}
          sx={{ minWidth: 0, overflowWrap: { md: 'anywhere' } }}
        />
      </ListItem>
    </Link>
  );
}

export default async function HomePage() {
  const [sources, recentlyAddedRecipes] = await Promise.all([
    getAllSources(),
    getRecentlyAddedRecipes(),
  ]);

  const {
    book: books = [],
    'youtube-channel': ytChannels = [],
    podcast: podcasts = [],
  } = Object.groupBy(sources, (source) => source.type);

  return (
    <Suspense>
      <AppHeader title="Cocktail Index" />
      <List
        sx={{
          mt: 2,
          display: { xs: 'block', lg: 'grid' },
          gridTemplateColumns: { lg: 'repeat(2, minmax(0, 1fr))' },
          gap: { lg: 2 },
          alignItems: 'start',
        }}
      >
        <Paper square sx={{ gridColumn: { lg: '1 / -1' } }}>
          <Link href={getRecipeListUrl()}>
            <ListItem disablePadding divider secondaryAction={<ChevronRightIcon />}>
              <ListItemButton>
                <ListItemIcon>
                  <SearchIcon />
                </ListItemIcon>
                <ListItemText primary="All Recipes" />
              </ListItemButton>
            </ListItem>
          </Link>
          {recentlyAddedRecipes.length > 0 && (
            <Link href={getRecentlyAddedUrl()}>
              <ListItem disablePadding divider secondaryAction={<ChevronRightIcon />}>
                <ListItemButton>
                  <ListItemIcon>
                    <HistoryIcon />
                  </ListItemIcon>
                  <ListItemText primary="Recently Added" />
                </ListItemButton>
              </ListItem>
            </Link>
          )}
        </Paper>
        <li>
          <ul>
            <ListSubheader>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <CalculatorIcon />
                Calculators
              </Stack>
            </ListSubheader>
            <Paper square>
              <Link href="/calculators/acid-adjusting">
                <ListItem divider secondaryAction={<ChevronRightIcon />}>
                  <ListItemText primary="Acid Adjusting" />
                </ListItem>
              </Link>
              <Link href="/calculators/juice-clarification">
                <ListItem divider secondaryAction={<ChevronRightIcon />}>
                  <ListItemText primary="Juice Clarification" />
                </ListItem>
              </Link>
              <Link href="/calculators/milk-clarification">
                <ListItem divider secondaryAction={<ChevronRightIcon />}>
                  <ListItemText primary="Milk Clarification" />
                </ListItem>
              </Link>
              <Link href="/calculators/saline">
                <ListItem divider secondaryAction={<ChevronRightIcon />}>
                  <ListItemText primary="Saline Solution Calculator" />
                </ListItem>
              </Link>
              <Link href="/calculators/brix">
                <ListItem divider secondaryAction={<ChevronRightIcon />}>
                  <ListItemText primary="Sugar Adjusting (Brix calculator)" />
                </ListItem>
              </Link>
            </Paper>
          </ul>
        </li>
        <li>
          <ul>
            <ListSubheader>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
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
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
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
            <ListSubheader>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <PodcastIcon />
                By Podcasts
              </Stack>
            </ListSubheader>
            <Paper square>
              {podcasts.map((source) => (
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
              <Link href={getNonAlcoholicRecipeListUrl()}>
                <ListItem divider secondaryAction={<ChevronRightIcon />}>
                  <ListItemText primary="Non-Alcoholic Recipes" />
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
