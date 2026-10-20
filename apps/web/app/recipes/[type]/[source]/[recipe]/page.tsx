import type { Source, WebsiteRef, YoutubeRef } from '@cocktails/data';
import { getRecipePageParams } from '@cocktails/data/params';
import { getRecipe } from '@cocktails/data/recipes';
import {
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Paper,
} from '@mui/material';
import { notFound, unstable_rethrow } from 'next/navigation';
import { match, P } from 'ts-pattern';
import AppHeader from '#/components/AppHeader';
import FixBugCard from '#/components/FixBugCard';
import IngredientList from '#/components/IngredientList';
import RecipeAttributionList from '#/components/RecipeAttributionList';
import SourceAboutCard from '#/components/SourceAboutCard';
import VideoListCard from '#/components/VideoListCard';
import WebsiteListCard from '#/components/WebsiteListCard';
import { getRecipeEditUrl } from '#/modules/url';
import styles from './style.module.css';

type Params = { type: Source['type']; source: string; recipe: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getRecipePageParams();
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { type, source, recipe: recipeSlug } = await params;

  try {
    const recipe = await getRecipe({ type: type, slug: source }, recipeSlug);

    return {
      title: `Cocktail Index | ${recipe.name} from ${recipe.source.name}`,
    };
  } catch (error) {
    unstable_rethrow(error);
    notFound();
  }
}

export default async function RecipePage({ params }: { params: Promise<Params> }) {
  const { type, source, recipe: recipeSlug } = await params;
  const recipe = await getRecipe({ type: type, slug: source }, recipeSlug);

  // Every ref type is handled explicitly: adding one to the Ref union in
  // @cocktails/data becomes a compile error here instead of a silently
  // unrendered ref. Book and podcast refs render in the source card — the book
  // ref names this recipe's chapter, podcast refs the episode — so neither
  // gets a dedicated section on the recipe page.
  const { videos, websites } = recipe.refs.reduce<{
    videos: YoutubeRef[];
    websites: WebsiteRef[];
  }>(
    (acc, ref) => {
      match(ref)
        .with({ type: 'youtube' }, (youtubeRef) => {
          acc.videos.push(youtubeRef);
        })
        .with({ type: 'website' }, (websiteRef) => {
          acc.websites.push(websiteRef);
        })
        .with(P.union({ type: 'book' }, { type: 'podcast' }), () => {})
        .exhaustive();
      return acc;
    },
    { videos: [], websites: [] },
  );
  if (recipe.source.type === 'youtube-channel') {
    // For youtube channels, the first video is always in the source card.
    videos.shift();
  }

  return (
    <>
      <AppHeader title={recipe.name} />
      <Box component="main">
        <Grid container columns={3} sx={{ textAlign: 'center', my: 1 }}>
          <Grid size={1}>
            <div className={styles.badge}>{recipe.preparation}</div>
          </Grid>
          <Grid size={1}>
            <div className={styles.badge}>{recipe.served_on}</div>
          </Grid>
          <Grid size={1}>
            <div className={styles.badge}>{recipe.glassware}</div>
          </Grid>
        </Grid>
        <IngredientList
          ingredients={recipe.ingredients}
          techniques={recipe.techniques}
          defaultServings={recipe.servings}
        />
        {Array.isArray(recipe.instructions) && recipe.instructions.length > 0 && (
          <List>
            <ListSubheader>Instructions</ListSubheader>
            <Paper square>
              {recipe.instructions.map((instruction, index) => (
                <ListItem divider key={instruction}>
                  <ListItemText>
                    {index + 1}. {instruction}
                  </ListItemText>
                </ListItem>
              ))}
            </Paper>
          </List>
        )}
        <SourceAboutCard
          source={recipe.source}
          chapterName={recipe.chapter?.name}
          refs={recipe.refs}
          sx={{ m: 1 }}
        />
        {recipe.attributions.length > 0 && (
          <RecipeAttributionList attributions={recipe.attributions} />
        )}
        {videos.length > 0 && <VideoListCard refs={videos} sx={{ m: 1 }} />}
        {websites.length > 0 && <WebsiteListCard refs={websites} sx={{ m: 1 }} />}
        <FixBugCard fixUrl={getRecipeEditUrl(recipe)} sx={{ m: 1 }} />
      </Box>
    </>
  );
}
