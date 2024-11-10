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
  Typography,
} from '@mui/material';
import { ingredientHasData } from '@/modules/hasData';

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

export default async function IngredientPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const category = await getCategory(slug);
  const ingredients = await getIngredientsForCategory(slug);

  return (
    <>
      <AppHeader title={category.name} />
      {(category.description || category.parents.length > 0) && (
        <Card sx={{ m: 2 }}>
          {category.description && (
            <CardContent>
              <Typography variant="body2">{category.description}</Typography>
            </CardContent>
          )}
          {category.parents.length > 0 && (
            <CardContent>
              <b>{category.name}</b> is a subset of{' '}
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
      {category.refs.length > 0 &&
        category.refs.map((ref) => {
          if (ref.type === 'youtube') {
            return <Video key={ref.videoId} id={ref.videoId} start={ref.start} />;
          }
        })}
      {ingredients.length > 0 && (
        <List>
          <ListSubheader>Examples of {category.name}</ListSubheader>
          <Paper square>
            {ingredients.map((ingredient) => {
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
    </>
  );
}
