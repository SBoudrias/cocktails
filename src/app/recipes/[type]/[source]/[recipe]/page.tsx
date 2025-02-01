import { notFound } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import RecipeDetails from '@/components/RecipeDetails';
import { getRecipe } from '@/modules/recipes';
import { getRecipePageParams } from '@/modules/params';
import RecipeSources from '@/components/RecipeSources';
import { Box, Button, Card, CardContent, Stack } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import { Source } from '@/types/Source';

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
        <RecipeDetails recipe={recipe} />
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
