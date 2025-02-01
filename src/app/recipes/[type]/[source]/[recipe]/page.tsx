import { notFound } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { getRecipe } from '@/modules/recipes';
import { getRecipePageParams } from '@/modules/params';
import RecipeSources from '@/components/RecipeSources';
import { Box, Button, Card, CardContent, Stack } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import { Source } from '@/types/Source';
import styles from './style.module.css';
import { Grid2, List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import IngredientList from '@/components/IngredientList';

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

  const githubDataUrl = `https://github.com/SBoudrias/cocktails/edit/main/src/data/recipes/${type}/${source}/${recipeSlug}.json`;

  return (
    <>
      <AppHeader title={recipe.name} />
      <Box component="main">
        <Grid2 container columns={3} sx={{ textAlign: 'center', my: 1 }}>
          <Grid2 size={1}>
            <div className={styles.badge}>{recipe.preparation}</div>
          </Grid2>
          <Grid2 size={1}>
            <div className={styles.badge}>{recipe.served_on}</div>
          </Grid2>
          <Grid2 size={1}>
            <div className={styles.badge}>{recipe.glassware}</div>
          </Grid2>
        </Grid2>
        <IngredientList ingredients={recipe.ingredients} />
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
        <RecipeSources recipe={recipe} />
        <Card sx={{ m: 2 }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center">
              <BugReportIcon />
              <span>Found an error?</span>
              <Button href={githubDataUrl} target="_blank" rel="noopener nofollow">
                Fix it over here!
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
