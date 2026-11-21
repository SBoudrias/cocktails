import { groupCategoriesBySystem } from '@cocktails/data/categories';
import {
  getIngredient,
  getIngredientRecipeCounts,
  getRecipesForIngredient,
  getSubstitutesForIngredient,
} from '@cocktails/data/ingredients';
import { getIngredientPageParams } from '@cocktails/data/params';
import uniqBy from 'lodash/uniqBy';
import { Tag } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, unstable_rethrow } from 'next/navigation';
import FixBugCard from '#/components/card/FixBugCard';
import VideoListCard from '#/components/card/VideoListCard';
import CategoryChips from '#/components/CategoryChips';
import IngredientList from '#/components/IngredientList';
import InstructionList from '#/components/InstructionList';
import SearchableRecipePage from '#/components/SearchableRecipePage';
import SubstitutionDrawer from '#/components/SubstitutionDrawer';
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
  const [substitution, relatedRecipes, recipeCounts, categoryGroups] = await Promise.all([
    getSubstitutesForIngredient(ingredient),
    getRecipesForIngredient(ingredient),
    getIngredientRecipeCounts(),
    groupCategoriesBySystem(ingredient.categories),
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
      underTitle={
        <>
          {categoryGroups.map((group) => (
            <CategoryChips
              key={group.system?.slug ?? 'house'}
              categories={group.categories}
              label={group.system ? `${group.system.name} categories` : 'Categories'}
            />
          ))}
          {substitution && (
            <SubstitutionDrawer ingredientName={ingredient.name}>
              <SubstitutionLists
                primaryHeader="Some substitution option"
                substitutes={substitution.substitutes}
                recipeCounts={recipeCounts}
                relatedCategories={substitution.relatedCategories}
                headerMode="flow"
              />
            </SubstitutionDrawer>
          )}
        </>
      }
      footer={
        <FixBugCard
          fixUrl={`https://github.com/SBoudrias/cocktails/edit/main/packages/data/data/ingredients/${ingredient.type}/${ingredient.slug}.json`}
          m={1}
        />
      }
    >
      {firstVideo && <Video id={firstVideo.videoId} start={firstVideo.start} />}
      {!ingredient.description && topCategory?.description ? (
        <Card m={1}>
          <CardHeader>
            <CardTitle className="text-xl">
              <Tag className="mr-1 inline size-5 align-text-bottom" aria-hidden="true" />
              {topCategory.name}
            </CardTitle>
          </CardHeader>
          <CardContent>{topCategory.description}</CardContent>
          <CardActions>
            <Link
              href={getCategoryUrl(topCategory)}
              aria-label="Learn more about this category"
              className={buttonVariants({ variant: 'text' })}
            >
              Learn more
            </Link>
          </CardActions>
        </Card>
      ) : (
        ingredient.description && (
          <Card m={1}>
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
        <InstructionList instructions={ingredient.instructions} />
      )}
      <IngredientCalculators ingredient={ingredient} />
      {additionalVideos.length > 0 && (
        <VideoListCard title="Other videos" refs={additionalVideos} m={1} />
      )}
    </SearchableRecipePage>
  );
}
