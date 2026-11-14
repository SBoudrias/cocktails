import type { RootIngredient } from '@cocktails/data';
import {
  getCategory,
  getChildCategories,
  getRelatedCategories,
} from '@cocktails/data/categories';
import {
  getIngredientRecipeCounts,
  getIngredientsForCategory,
} from '@cocktails/data/ingredients';
import { getCategoryPageParams } from '@cocktails/data/params';
import { getRecipeByCategory } from '@cocktails/data/recipes';
import { Card, CardContent, Typography } from '@mui/material';
import type { Metadata } from 'next';
import { notFound, unstable_rethrow } from 'next/navigation';
import CategoryChips from '#/components/CategoryChips';
import FixBugCard from '#/components/FixBugCard';
import { LinkList, LinkListItem } from '#/components/LinkList';
import SearchableRecipePage from '#/components/SearchableRecipePage';
import { RelatedCategoriesList } from '#/components/SubstitutionLists';
import Video from '#/components/Video';
import VideoListCard from '#/components/VideoListCard';
import { ingredientHasData } from '#/modules/hasData';
import { getCategoryUrl, getIngredientUrl } from '#/modules/url';

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getCategoryPageParams();
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
      title: `Indexotica | Learn about ${category.name}`,
      description:
        category.description ??
        `Learn about ${category.name}, its bottles and the cocktail recipes that use it.`,
    };
  } catch (error) {
    unstable_rethrow(error);
    notFound();
  }
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const category = await getCategory(slug);
  const [members, relatedRecipes, childCategories, relatedCategories, recipeCounts] =
    await Promise.all([
      getIngredientsForCategory(category),
      getRecipeByCategory(category),
      getChildCategories(category),
      getRelatedCategories(category),
      getIngredientRecipeCounts(),
    ]);

  const videos = category.refs.filter((ref) => ref.type === 'youtube');
  const [firstVideo, ...additionalVideos] = videos;

  return (
    <SearchableRecipePage
      title={category.name}
      catalogKey={relatedRecipes.length > 0 ? `category/${category.slug}` : undefined}
      recipeCount={relatedRecipes.length}
      listHeader={`Recipes using ${category.name}`}
      underTitle={
        <CategoryChips categories={category.parents} label="Parent categories" />
      }
      footer={
        <FixBugCard
          fixUrl={`https://github.com/SBoudrias/cocktails/edit/main/src/data/categories/${category.slug}.json`}
          sx={{ m: 1 }}
        />
      }
    >
      {firstVideo && <Video id={firstVideo.videoId} start={firstVideo.start} />}
      {category.description && (
        <Card sx={{ m: 1 }}>
          <CardContent>{category.description}</CardContent>
        </Card>
      )}
      {childCategories.length > 0 && (
        <LinkList
          header={`Subcategories of ${category.name}`}
          items={childCategories}
          renderItem={(childCategory) => (
            <LinkListItem
              key={childCategory.slug}
              href={getCategoryUrl(childCategory)}
              primary={childCategory.name}
            />
          )}
        />
      )}
      {members.length > 0 && (
        <LinkList
          header={`Examples of ${category.name}`}
          items={members}
          renderItem={(member) => renderIngredient(member, recipeCounts)}
        />
      )}
      <RelatedCategoriesList categories={relatedCategories} />
      {additionalVideos.length > 0 && (
        <VideoListCard title="Other videos" refs={additionalVideos} sx={{ m: 1 }} />
      )}
    </SearchableRecipePage>
  );
}

function renderIngredient(ingredient: RootIngredient, recipeCounts: Map<string, number>) {
  return (
    <LinkListItem
      key={ingredient.slug}
      href={ingredientHasData(ingredient) ? getIngredientUrl(ingredient) : undefined}
      primary={ingredient.name}
      tertiary={
        <Typography color="textSecondary">
          {recipeCounts.get(ingredient.slug) ?? 0}
        </Typography>
      }
    />
  );
}
