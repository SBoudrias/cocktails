import fs from 'node:fs/promises';
import path from 'node:path';
import { notFound } from 'next/navigation';
import { getCategory } from '@/modules/categories';
import { CATEGORY_ROOT } from '@/modules/constants';
import AppHeader from '@/components/AppHeader';
import CategoryName from '@/components/CategoryName';
import { getIngredientsForCategory } from '@/modules/ingredients';
import Video from '@/components/Video';
import Link from 'next/link';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getIngredientUrl } from '@/modules/url';
import {
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Paper,
  Stack,
} from '@mui/material';
import { ingredientHasData } from '@/modules/hasData';
import FixBugCard from '@/components/FixBugCard';
import VideoListCard from '@/components/VideoListCard';
import { getRecipeByCategory } from '@/modules/recipes';
import RecipeList from '@/components/RecipeList';

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const params = [];

  for await (const dataFilePath of await fs.readdir(CATEGORY_ROOT)) {
    const categorySlug = path.basename(dataFilePath, '.json');
    params.push({
      slug: categorySlug,
    });
  }

  return params;
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  try {
    const category = await getCategory(slug);

    return {
      title: `Cocktail Index | Learn about ${category.name}`,
    };
  } catch {
    notFound();
  }
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const category = await getCategory(slug);
  const [members, substitutes] = await getIngredientsForCategory(category);
  const relatedRecipes = await getRecipeByCategory(category);

  const videos = category.refs.filter((ref) => ref.type === 'youtube');
  const firstVideo = videos.shift();

  return (
    <>
      <AppHeader title={category.name} />
      {firstVideo && <Video id={firstVideo.videoId} start={firstVideo.start} />}
      {(category.description || category.parents.length > 0) && (
        <Card sx={{ m: 1 }}>
          {category.description && <CardContent>{category.description}</CardContent>}
          {category.parents.length > 0 && (
            <CardContent>
              <b>{category.name}</b> is a subset of
              <Stack
                direction="row"
                alignItems="baseline"
                spacing={1}
                sx={{ flexWrap: 'wrap' }}
              >
                {category.parents.map((category) => (
                  <CategoryName key={category.slug} category={category} />
                ))}
              </Stack>
            </CardContent>
          )}
        </Card>
      )}
      {members.length > 0 && (
        <List>
          <ListSubheader>Examples of {category.name}</ListSubheader>
          <Paper square>
            {members.map((ingredient) => {
              if (ingredientHasData(ingredient)) {
                return (
                  <Link key={ingredient.slug} href={getIngredientUrl(ingredient)}>
                    <ListItem divider secondaryAction={<ChevronRightIcon />}>
                      <ListItemText>{ingredient.name}</ListItemText>
                    </ListItem>
                  </Link>
                );
              }

              return (
                <ListItem key={ingredient.slug} divider>
                  <ListItemText>{ingredient.name}</ListItemText>
                </ListItem>
              );
            })}
          </Paper>
        </List>
      )}
      {substitutes.length > 0 && (
        <List>
          <ListSubheader>Potential substitutes for {category.name}</ListSubheader>
          <Paper square>
            {substitutes.map((ingredient) => {
              if (ingredientHasData(ingredient)) {
                return (
                  <Link key={ingredient.slug} href={getIngredientUrl(ingredient)}>
                    <ListItem divider secondaryAction={<ChevronRightIcon />}>
                      <ListItemText>{ingredient.name}</ListItemText>
                    </ListItem>
                  </Link>
                );
              }

              return (
                <ListItem key={ingredient.slug} divider>
                  <ListItemText>{ingredient.name}</ListItemText>
                </ListItem>
              );
            })}
          </Paper>
        </List>
      )}
      {videos.length > 0 && (
        <VideoListCard title="Other videos" refs={videos} sx={{ m: 1 }} />
      )}
      {relatedRecipes.length > 0 && (
        <RecipeList recipes={relatedRecipes} header={`Recipes using ${category.name}`} />
      )}
      <FixBugCard
        fixUrl={`https://github.com/SBoudrias/cocktails/edit/main/src/data/categories/${slug}.json`}
        sx={{ m: 1 }}
      />
    </>
  );
}
