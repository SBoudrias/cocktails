import type { RootIngredient } from '@cocktails/data';
import {
  getCategory,
  getChildCategories,
  getRelatedCategories,
} from '@cocktails/data/categories';
import { getIngredientsForCategory } from '@cocktails/data/ingredients';
import { getCategoryPageParams } from '@cocktails/data/params';
import { getRecipeByCategory } from '@cocktails/data/recipes';
import { Card, CardContent, Stack } from '@mui/material';
import type { Metadata } from 'next';
import { notFound, unstable_rethrow } from 'next/navigation';
import CategoryName from '#/components/CategoryName';
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
  const [members, relatedRecipes, childCategories, relatedCategories] = await Promise.all(
    [
      getIngredientsForCategory(category),
      getRecipeByCategory(category),
      getChildCategories(category),
      getRelatedCategories(category),
    ],
  );

  const videos = category.refs.filter((ref) => ref.type === 'youtube');
  const [firstVideo, ...additionalVideos] = videos;

  return (
    <SearchableRecipePage
      title={category.name}
      catalogKey={relatedRecipes.length > 0 ? `category/${category.slug}` : undefined}
      recipeCount={relatedRecipes.length}
      listHeader={`Recipes using ${category.name}`}
      footer={
        <FixBugCard
          fixUrl={`https://github.com/SBoudrias/cocktails/edit/main/src/data/categories/${category.slug}.json`}
          className="m-2"
        />
      }
    >
      {firstVideo && <Video id={firstVideo.videoId} start={firstVideo.start} />}
      {(category.description || category.parents.length > 0) && (
        <Card sx={{ m: 1 }}>
          {category.description && <CardContent>{category.description}</CardContent>}
          {category.parents.length > 0 && (
            <CardContent>
              <b>{category.name}</b> is a subset of
              <Stack
                direction="row"
                spacing={1}
                sx={{ flexWrap: 'wrap', alignItems: 'baseline' }}
              >
                {category.parents.map((parentCategory) => (
                  <CategoryName key={parentCategory.slug} category={parentCategory} />
                ))}
              </Stack>
            </CardContent>
          )}
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
          renderItem={renderIngredient}
        />
      )}
      <RelatedCategoriesList categories={relatedCategories} />
      {additionalVideos.length > 0 && (
        <VideoListCard title="Other videos" refs={additionalVideos} className="m-2" />
      )}
    </SearchableRecipePage>
  );
}

function renderIngredient(ingredient: RootIngredient) {
  return (
    <LinkListItem
      key={ingredient.slug}
      href={ingredientHasData(ingredient) ? getIngredientUrl(ingredient) : undefined}
      primary={ingredient.name}
    />
  );
}
