import type { Metadata } from 'next';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
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
import Link from 'next/link';
import { notFound } from 'next/navigation';
import fs from 'node:fs/promises';
import path from 'node:path';
import AppHeader from '@/components/AppHeader';
import CategoryName from '@/components/CategoryName';
import FixBugCard from '@/components/FixBugCard';
import Video from '@/components/Video';
import VideoListCard from '@/components/VideoListCard';
import { getCategory, getChildCategories } from '@/modules/categories';
import { CATEGORY_ROOT } from '@/modules/constants';
import { ingredientHasData } from '@/modules/hasData';
import { getIngredientsForCategory } from '@/modules/ingredients';
import { getRecipeByCategory } from '@/modules/recipes';
import { getIngredientUrl } from '@/modules/url';
import CategoryClient from './CategoryClient';

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

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
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
  const childCategories = await getChildCategories(category);
  const categorySlugs = [category.slug, ...childCategories.map((c) => c.slug)];

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
        <CategoryClient
          category={category}
          relatedRecipes={relatedRecipes}
          categorySlugs={categorySlugs}
        />
      )}
      <FixBugCard
        fixUrl={`https://github.com/SBoudrias/cocktails/edit/main/src/data/categories/${slug}.json`}
        sx={{ m: 1 }}
      />
    </>
  );
}
