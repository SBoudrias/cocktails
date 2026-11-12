import {
  getIngredient,
  getRecipesForIngredient,
  getSubstitutesForIngredient,
} from '@cocktails/data/ingredients';
import { getIngredientPageParams } from '@cocktails/data/params';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
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
import uniqBy from 'lodash/uniqBy';
import type { Metadata } from 'next';
import { notFound, unstable_rethrow } from 'next/navigation';
import CategoryName from '#/components/CategoryName';
import FixBugCard from '#/components/FixBugCard';
import IngredientList from '#/components/IngredientList';
import { LinkList, LinkListItem } from '#/components/LinkList';
import SearchableRecipePage from '#/components/SearchableRecipePage';
import Video from '#/components/Video';
import VideoListCard from '#/components/VideoListCard';
import { ingredientHasData } from '#/modules/hasData';
import { getCategoryUrl, getIngredientUrl } from '#/modules/url';
import IngredientCalculators from './IngredientCalculators';

type Params = { type: string; slug: string };

/**
 * The primary substitution list caps at this many links: a capped list holds
 * 14 bottles plus the see-all link to the category page as its last item.
 */
const MAX_SUBSTITUTION_LINKS = 15;

export async function generateStaticParams(): Promise<Params[]> {
  return getIngredientPageParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { type, slug } = await params;

  try {
    const ingredient = await getIngredient(type, slug);

    return {
      title: `Indexotica | Learn about ${ingredient.name}`,
      description:
        ingredient.description ??
        `Learn about ${ingredient.name} and find cocktail recipes that use it.`,
    };
  } catch (error) {
    unstable_rethrow(error);
    notFound();
  }
}

export default async function IngredientPage({ params }: { params: Promise<Params> }) {
  const { type, slug } = await params;

  const ingredient = await getIngredient(type, slug);
  const [substitution, relatedRecipes] = await Promise.all([
    getSubstitutesForIngredient(ingredient),
    getRecipesForIngredient(ingredient),
  ]);

  const topCategory = ingredient.categories[0];
  const [firstVideo, ...additionalVideos] = uniqBy(
    [...ingredient.refs, ...ingredient.categories.flatMap((c) => c.refs ?? [])].filter(
      (ref) => ref.type === 'youtube',
    ),
    'videoId',
  );

  return (
    <SearchableRecipePage
      title={ingredient.name}
      catalogKey={
        relatedRecipes.length > 0
          ? `ingredient/${ingredient.type}/${ingredient.slug}`
          : undefined
      }
      recipeCount={relatedRecipes.length}
      listHeader={`Recipes using ${ingredient.name}`}
      footer={
        <FixBugCard
          fixUrl={`https://github.com/SBoudrias/cocktails/edit/main/src/data/ingredients/${ingredient.type}/${ingredient.slug}.json`}
          sx={{ m: 1 }}
        />
      }
    >
      {firstVideo && <Video id={firstVideo.videoId} start={firstVideo.start} />}
      {!ingredient.description && topCategory?.description ? (
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
      ) : (
        <Card sx={{ m: 1 }}>
          {ingredient.description && <CardContent>{ingredient.description}</CardContent>}
          {ingredient.categories.length > 0 && (
            <CardContent>
              <b>{ingredient.name}</b>{' '}
              {ingredient.categories.length === 1 ? 'category is' : 'categories are'}:
              <Stack
                direction="row"
                spacing={1}
                sx={{ flexWrap: 'wrap', alignItems: 'baseline' }}
              >
                {ingredient.categories.map((category) => (
                  <CategoryName key={category.slug} category={category} />
                ))}
              </Stack>
            </CardContent>
          )}
        </Card>
      )}
      {ingredient.ingredients.length > 0 && (
        <IngredientList ingredients={ingredient.ingredients} />
      )}
      {Array.isArray(ingredient.instructions) && ingredient.instructions.length > 0 && (
        <List>
          <ListSubheader>Instructions</ListSubheader>
          <Paper square>
            {ingredient.instructions.map((instruction, index) => (
              <ListItem divider key={index}>
                <ListItemText>
                  {index + 1}. {instruction}
                </ListItemText>
              </ListItem>
            ))}
          </Paper>
        </List>
      )}
      <IngredientCalculators ingredient={ingredient} />
      {substitution && (
        <>
          {substitution.substitutes.length > 0 && (
            <LinkList
              header="Some substitution option"
              items={substitution.substitutes.slice(0, MAX_SUBSTITUTION_LINKS - 1)}
              renderItem={(substitute) => (
                <LinkListItem
                  key={substitute.slug}
                  href={
                    ingredientHasData(substitute)
                      ? getIngredientUrl(substitute)
                      : undefined
                  }
                  primary={substitute.name}
                />
              )}
              footer={
                substitution.substitutes.length >= MAX_SUBSTITUTION_LINKS && (
                  <LinkListItem
                    href={getCategoryUrl(substitution.category)}
                    primary={
                      <span>
                        <LocalOfferIcon
                          fontSize="small"
                          sx={{ mr: 1, verticalAlign: 'text-bottom' }}
                        />
                        {substitution.category.name}
                      </span>
                    }
                    secondary="See all options"
                  />
                )
              }
            />
          )}
          {substitution.relatedCategories.length > 0 && (
            <LinkList
              header="Substitution-friendly categories"
              items={substitution.relatedCategories}
              renderItem={(relatedCategory) => (
                <LinkListItem
                  key={relatedCategory.slug}
                  href={getCategoryUrl(relatedCategory)}
                  primary={relatedCategory.name}
                />
              )}
            />
          )}
        </>
      )}
      {additionalVideos.length > 0 && (
        <VideoListCard title="Other videos" refs={additionalVideos} sx={{ m: 1 }} />
      )}
    </SearchableRecipePage>
  );
}
