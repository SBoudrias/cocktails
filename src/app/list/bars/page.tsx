import { Metadata } from 'next';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { Suspense } from 'react';
import { getAllRecipes } from '@/modules/recipes';
import { List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import { getBarRecipesUrl } from '@/modules/url';
import { ChevronRight } from '@mui/icons-material';
import groupByFirstLetter from '@/modules/groupByFirstLetter';

export const metadata: Metadata = {
  title: 'Cocktail Index | Bars list',
};

export default async function BarListPage() {
  const allRecipes = await getAllRecipes();

  // Extract unique bars from recipe attributions
  const barsMap = new Map<string, { name: string; recipeCount: number }>();

  allRecipes.forEach((recipe) => {
    recipe.attributions
      .filter((attribution) => attribution.relation === 'bar')
      .forEach((attribution) => {
        const barName = attribution.source;
        const bar = barsMap.get(barName) || { name: barName, recipeCount: 0 };
        bar.recipeCount += 1;
        barsMap.set(barName, bar);
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
                    <Link href={getBarRecipesUrl(bar.name)} key={bar.name}>
                      <ListItem divider secondaryAction={<ChevronRight />}>
                        <ListItemText
                          primary={bar.name}
                          secondary={`${bar.recipeCount} recipe${bar.recipeCount !== 1 ? 's' : ''}`}
                        />
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
