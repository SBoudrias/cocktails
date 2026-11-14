import {
  getIngredient,
  getIngredientRecipeCounts,
  getRecipesForIngredient,
  getSubstitutesForIngredient,
} from '@cocktails/data/ingredients';
import { getIngredientPageParams } from '@cocktails/data/params';
import { List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import uniqBy from 'lodash/uniqBy';
import { Tag } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound, unstable_rethrow } from 'next/navigation';
import CategoryChips from '#/components/CategoryChips';
import FixBugCard from '#/components/FixBugCard';
import IngredientList from '#/components/IngredientList';
import SearchableRecipePage from '#/components/SearchableRecipePage';
import SubstitutionLists from '#/components/SubstitutionLists';
import { buttonVariants } from '#/components/ui/button-variants';
import {
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import Video from '#/components/Video';
import VideoListCard from '#/components/VideoListCard';
import { getCategoryUrl } from '#/modules/url';
import IngredientCalculators from './IngredientCalculators';

type Params = { type: string; slug: string };

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
      title: `Indexotica | ${ingredient.name}`,
      description:
        ingredient.description ??
        `Learn about ${ingredient.name} and the cocktail recipes that use it.`,
    };
  } catch (error) {
    unstable_rethrow(error);
    notFound();
  }
}

export default async function IngredientPage({ params }: { params: Promise<Params> }) {
  const { type, slug } = await params;

  const ingredient = await getIngredient(type, slug);
  const [substitution, relatedRecipes, recipeCounts] = await Promise.all([
    getSubstitutesForIngredient(ingredient),
    getRecipesForIngredient(ingredient),
    getIngredientRecipeCounts(),
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
      underTitle={<CategoryChips categories={ingredient.categories} />}
      footer={
        <FixBugCard
          fixUrl={`https://github.com/SBoudrias/cocktails/edit/main/src/data/ingredients/${ingredient.type}/${ingredient.slug}.json`}
          className="m-2"
        />
      }
    >
      {firstVideo && <Video id={firstVideo.videoId} start={firstVideo.start} />}
      {!ingredient.description && topCategory?.description ? (
        <Card className="m-2">
          <CardHeader>
            <CardTitle className="text-xl leading-8 font-normal">
              <Tag className="mr-1 inline size-5 align-text-bottom" aria-hidden="true" />
              {topCategory.name}
            </CardTitle>
          </CardHeader>
          <CardContent>{topCategory.description}</CardContent>
          <CardActions>
            <a
              href={getCategoryUrl(topCategory)}
              aria-label="Learn more about this category"
              className={buttonVariants({ variant: 'text' })}
            >
              Learn more
            </a>
          </CardActions>
        </Card>
      ) : (
        ingredient.description && (
          <Card className="m-2">
            <CardContent>
              <p>{ingredient.description}</p>
            </CardContent>
          </Card>
        )
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
        <SubstitutionLists
          primaryHeader="Some substitution option"
          substitutes={substitution.substitutes}
          recipeCounts={recipeCounts}
          seeAll={{
            href: getCategoryUrl(substitution.category),
            label: substitution.category.name,
          }}
          relatedCategories={substitution.relatedCategories}
        />
      )}
      {additionalVideos.length > 0 && (
        <VideoListCard title="Other videos" refs={additionalVideos} className="m-2" />
      )}
    </SearchableRecipePage>
  );
}
