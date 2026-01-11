import type { Metadata } from 'next';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { Suspense } from 'react';
import { getAllRecipes } from '@/modules/recipes';
import {
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { getBarRecipesUrl } from '@/modules/url';
import { ChevronRight } from '@mui/icons-material';
import groupByFirstLetter from '@/modules/groupByFirstLetter';

export const metadata: Metadata = {
  title: 'Cocktail Index | Bars list',
};

export default async function BarListPage() {
  const allRecipes = await getAllRecipes();

  // Extract unique bars from recipe attributions
  const barsMap = new Map<
    string,
    { name: string; location?: string; recipeCount: number }
  >();

  allRecipes.forEach((recipe) => {
    recipe.attributions
      .filter((attribution) => attribution.relation === 'bar')
      .forEach((attribution) => {
        const mapKey = `${attribution.source}${attribution.location ?? ''}`;
        const bar = barsMap.get(mapKey) || {
          name: attribution.source,
          location: attribution.location,
          recipeCount: 0,
        };
        bar.recipeCount += 1;
        barsMap.set(mapKey, bar);
      });
  });

  // Convert to array and sort
  const bars = Array.from(barsMap.values());

  // Group bars by first letter
  const barGroups = groupByFirstLetter(bars);

  return (
    <Suspense>
      <AppHeader title="All Bars" />
      <List>
        {barGroups.map(([letter, bars]) => {
          if (!bars) return null;

          return (
            <li key={letter}>
              <List>
                <ListSubheader>{letter}</ListSubheader>
                <Paper square>
                  {bars.map((bar) => (
                    <Link
                      href={getBarRecipesUrl(bar)}
                      key={bar.name + (bar.location ?? '')}
                    >
                      <ListItem
                        divider
                        secondaryAction={
                          <Stack direction="row" spacing={1}>
                            <Typography color="textSecondary">
                              {bar.recipeCount}
                            </Typography>
                            <ChevronRight />
                          </Stack>
                        }
                      >
                        <ListItemText primary={bar.name} secondary={bar.location} />
                      </ListItem>
                    </Link>
                  ))}
                </Paper>
              </List>
            </li>
          );
        })}
      </List>
    </Suspense>
  );
}
