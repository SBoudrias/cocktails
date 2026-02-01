import type { Source } from '@cocktails/data';
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
import { notFound } from 'next/navigation';
import AppHeader from '#/components/AppHeader';
import FixBugCard from '#/components/FixBugCard';
import IngredientList from '#/components/IngredientList';
import RecipeAttributionCard from '#/components/RecipeAttributionCard';
import SourceAboutCard from '#/components/SourceAboutCard';
import VideoListCard from '#/components/VideoListCard';
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
  } catch {
    notFound();
  }
}

export default async function RecipePage({ params }: { params: Promise<Params> }) {
  const { type, source, recipe: recipeSlug } = await params;
  const recipe = await getRecipe({ type: type, slug: source }, recipeSlug);

  const videos = recipe.refs.filter((ref) => ref.type === 'youtube');
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
          defaultServings={recipe.servings}
        />
        {Array.isArray(recipe.instructions) && recipe.instructions.length > 0 && (
          <List>
            <ListSubheader>Instructions</ListSubheader>
            <Paper square>
              {recipe.instructions.map((instruction, index) => (
                <ListItem divider key={index}>
                  <ListItemText>
                    {index + 1}. {instruction}
                  </ListItemText>
                </ListItem>
              ))}
            </Paper>
          </List>
        )}
        <SourceAboutCard source={recipe.source} refs={recipe.refs} sx={{ m: 1 }} />
        {recipe.attributions.length > 0 && (
          <RecipeAttributionCard recipe={recipe} sx={{ m: 1 }} />
        )}
        {videos.length > 0 && <VideoListCard refs={videos} sx={{ m: 1 }} />}
        <FixBugCard
          fixUrl={
            recipe.chapter
              ? `https://github.com/SBoudrias/cocktails/edit/main/src/data/recipes/${type}/${source}/${encodeURIComponent(`${String(recipe.chapter.order).padStart(2, '0')}_${recipe.chapter.name}`)}/${recipeSlug}.json`
              : `https://github.com/SBoudrias/cocktails/edit/main/src/data/recipes/${type}/${source}/${recipeSlug}.json`
          }
          sx={{ m: 1 }}
        />
      </Box>
    </>
  );
}
