import { notFound } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { getIngredient, getSubstitutesForIngredient } from '@/modules/ingredients';
import { getIngredientPageParams } from '@/modules/params';
import Video from '@/components/Video';
import Link from 'next/link';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { getCategoryUrl, getIngredientUrl } from '@/modules/url';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Paper,
  Stack,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { ingredientHasData } from '@/modules/hasData';
import { uniqBy } from 'lodash';
import IngredientList from '@/components/IngredientList';
import FixBugCard from '@/components/FixBugCard';
import VideoListCard from '@/components/VideoListCard';
import CategoryName from '@/components/CategoryName';
import AcidAdjustingCalculator from '@/components/AcidAdjustingCalculator';

type Params = { type: string; slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getIngredientPageParams();
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { type, slug } = await params;

  try {
    const ingredient = await getIngredient(type, slug);

    return {
      title: `Cocktail Index | Learn about ${ingredient.name}`,
    };
  } catch {
    notFound();
  }
}

export default async function IngredientPage({ params }: { params: Promise<Params> }) {
  const { type, slug } = await params;

  const ingredient = await getIngredient(type, slug);
  const substitutes = await getSubstitutesForIngredient(ingredient);

  const topCategory = ingredient.categories[0];

  let descriptionCard;
  if (!ingredient.description && topCategory?.description) {
    descriptionCard = (
      <Card sx={{ m: 1 }}>
        <CardHeader
          title={
            <>
              <LocalOfferIcon />
              &nbsp;{topCategory.name}
            </>
          }
          slotProps={{ title: 'h6' }}
        />
        <CardContent>{topCategory.description}</CardContent>
        <CardActions sx={{ justifyContent: 'end' }}>
          <Button href={getCategoryUrl(topCategory)}>Learn more</Button>
        </CardActions>
      </Card>
    );
  } else {
    descriptionCard = (
      <Card sx={{ m: 1 }}>
        {ingredient.description && <CardContent>{ingredient.description}</CardContent>}
        {ingredient.categories.length > 0 && (
          <CardContent>
            <b>{ingredient.name}</b>{' '}
            {ingredient.categories.length === 1 ? 'category is' : 'categories are'}:
            <Stack
              direction="row"
              alignItems="baseline"
              spacing={1}
              sx={{ flexWrap: 'wrap' }}
            >
              {ingredient.categories.map((category) => (
                <CategoryName key={category.slug} category={category} />
              ))}
            </Stack>
          </CardContent>
        )}
      </Card>
    );
  }

  const allRefs = [
    ...ingredient.refs,
    ...ingredient.categories.flatMap((c) => c.refs ?? []),
  ];
  const videos = uniqBy(
    allRefs.filter((ref) => ref.type === 'youtube'),
    'videoId',
  );
  const firstVideo = videos.shift();

  return (
    <>
      <AppHeader title={ingredient.name} />
      {firstVideo && <Video id={firstVideo.videoId} start={firstVideo.start} />}
      {descriptionCard}
      {ingredient.ingredients.length > 0 && (
        <IngredientList ingredients={ingredient.ingredients} />
      )}
      {ingredient.type === 'juice' &&
        'acidity' in ingredient &&
        ingredient.acidity != null && (
          <AcidAdjustingCalculator defaultAcidity={ingredient.acidity} />
        )}
      {substitutes.length > 0 && (
        <List>
          <ListSubheader>Some substitution option</ListSubheader>
          <Paper square>
            {substitutes.slice(0, 10).map((substitute) => {
              if (ingredientHasData(substitute)) {
                return (
                  <Link key={substitute.slug} href={getIngredientUrl(substitute)}>
                    <ListItem divider secondaryAction={<ChevronRightIcon />}>
                      <ListItemText>{substitute.name}</ListItemText>
                    </ListItem>
                  </Link>
                );
              }

              return (
                <ListItem key={substitute.slug} divider>
                  <ListItemText>{substitute.name}</ListItemText>
                </ListItem>
              );
            })}
          </Paper>
        </List>
      )}
      {videos.length > 0 && (
        <VideoListCard title="Other videos" refs={videos} sx={{ m: 1 }} />
      )}
      <FixBugCard
        fixUrl={`https://github.com/SBoudrias/cocktails/edit/main/src/data/ingredients/${type}/${slug}.json`}
        sx={{ m: 1 }}
      />
    </>
  );
}
