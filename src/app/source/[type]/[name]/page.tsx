import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Source } from '@/types/Source';
import AppHeader from '@/components/AppHeader';
import SourceAboutCard from '@/components/SourceAboutCard';
import { getSourcePageParams } from '@/modules/params';
import { getRecipesFromSource } from '@/modules/recipes';
import { getSource } from '@/modules/sources';
import { getRecipeUrl } from '@/modules/url';

type Params = { type: Source['type']; name: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getSourcePageParams();
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { type, name } = await params;

  try {
    const source = await getSource(type, name);

    return {
      title: `Cocktail Index | ${source.name}`,
    };
  } catch {
    notFound();
  }
}

export default async function SourcePage({ params }: { params: Promise<Params> }) {
  const { type, name } = await params;

  const source = await getSource(type, name);
  const recipes = await getRecipesFromSource(source);

  return (
    <Suspense>
      <AppHeader title={source.name} />
      <SourceAboutCard source={source} sx={{ m: 2 }} />
      <List>
        <ListSubheader>All recipes</ListSubheader>
        <Paper square>
          {recipes.map((recipe) => (
            <Link href={getRecipeUrl(recipe)} key={recipe.slug}>
              <ListItem divider secondaryAction={<ChevronRightIcon />}>
                <ListItemText primary={recipe.name} />
              </ListItem>
            </Link>
          ))}
        </Paper>
      </List>
    </Suspense>
  );
}
