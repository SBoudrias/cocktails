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
import { notFound, unstable_rethrow } from 'next/navigation';
import { isMatching } from 'ts-pattern';
import AppHeader from '#/components/AppHeader';
import FixBugCard from '#/components/FixBugCard';
import IngredientList from '#/components/IngredientList';
import RecipeAttributionCard from '#/components/RecipeAttributionCard';
import SourceAboutCard from '#/components/SourceAboutCard';
import VideoListCard from '#/components/VideoListCard';
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

  const videos = recipe.refs.filter((ref) => ref.type === 'youtube');
  const hasSourceVideo =
    isMatching({ type: 'youtube-channel' }, recipe.source) && videos.length === 1;

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
        <Box
          sx={{
            m: 1,
            display: { md: 'grid' },
            gridTemplateColumns: {
              md:
                recipe.attributions.length > 0
                  ? 'minmax(0, 1fr) 280px'
                  : 'minmax(0, 1fr)',
            },
            gap: 2,
            alignItems: 'start',
          }}
        >
          <SourceAboutCard
            source={recipe.source}
            chapterName={recipe.chapter?.name}
            refs={recipe.refs}
            showVideo={hasSourceVideo}
            sx={{ minWidth: 0 }}
          />
          {recipe.attributions.length > 0 && (
            <RecipeAttributionCard
              recipe={recipe}
              sx={{ minWidth: 0, maxWidth: { md: 280 }, mt: { xs: 1, md: 0 } }}
            />
          )}
        </Box>
        {videos.length > 0 && !hasSourceVideo && (
          <VideoListCard refs={videos} sx={{ m: 1 }} />
        )}
        <FixBugCard fixUrl={getRecipeEditUrl(recipe)} sx={{ m: 1 }} />
      </Box>
    </>
  );
}
