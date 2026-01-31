'use client';

import type { Category, Recipe, RootIngredient } from '@cocktails/data';
import AppHeader from '#/components/AppHeader';
import CategoryName from '#/components/CategoryName';
import FixBugCard from '#/components/FixBugCard';
import { LinkList, LinkListItem } from '#/components/LinkList';
import Quantity from '#/components/Quantity';
import SearchableList from '#/components/SearchableList';
import SearchAllLink from '#/components/SearchAllLink';
import SearchHeader from '#/components/SearchHeader';
import Video from '#/components/Video';
import VideoListCard from '#/components/VideoListCard';
import useNameIsUnique from '#/hooks/useNameIsUnique';
import { getRecipeAttribution } from '#/modules/getRecipeAttribution';
import { ingredientHasData } from '#/modules/hasData';
import { getRecipeSearchText } from '#/modules/searchText';
import { getIngredientUrl, getRecipeUrl } from '#/modules/url';
import { Card, CardContent, CardHeader, Stack } from '@mui/material';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';

export default function CategoryClient({
  category,
  members,
  substitutes,
  relatedRecipes,
  childCategories,
}: {
  category: Category;
  members: RootIngredient[];
  substitutes: RootIngredient[];
  relatedRecipes: Recipe[];
  childCategories: Category[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  const recipeNameIsUnique = useNameIsUnique(relatedRecipes);
  const isSearching = searchTerm != null && searchTerm.trim() !== '';

  const categorySlugs = useMemo(
    () => [category.slug, ...childCategories.map((c) => c.slug)],
    [category.slug, childCategories],
  );

  const { firstVideo, additionalVideos } = useMemo(() => {
    const videos = category.refs.filter((ref) => ref.type === 'youtube');
    return {
      firstVideo: videos[0],
      additionalVideos: videos.slice(1),
    };
  }, [category.refs]);

  const emptyState = (
    <>
      <Card sx={{ m: 2 }}>
        <CardHeader title="No results found" />
      </Card>
      <SearchAllLink searchTerm={searchTerm} />
    </>
  );

  const renderRecipe = useCallback(
    (recipe: Recipe) => {
      // Find the first ingredient that matches this category
      const ing = recipe.ingredients.find((ingredient) => {
        if (ingredient.type === 'category') {
          return ingredient.slug === category.slug;
        }
        return ingredient.categories.some((c) => categorySlugs.includes(c.slug));
      });
      const recipeUrl = getRecipeUrl(recipe);

      return (
        <LinkListItem
          key={recipeUrl}
          href={recipeUrl}
          primary={recipe.name}
          secondary={
            recipeNameIsUnique(recipe) ? undefined : getRecipeAttribution(recipe)
          }
          tertiary={ing && <Quantity quantity={ing.quantity} preferredUnit="oz" />}
        />
      );
    },
    [category.slug, categorySlugs, recipeNameIsUnique],
  );

  return (
    <>
      {relatedRecipes.length > 0 ? (
        <SearchHeader
          title={category.name}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      ) : (
        <AppHeader title={category.name} />
      )}
      {isSearching ? (
        <SearchableList
          items={relatedRecipes}
          getSearchText={getRecipeSearchText}
          renderItem={renderRecipe}
          searchTerm={searchTerm}
          emptyState={emptyState}
        />
      ) : (
        <>
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
                    {category.parents.map((parentCategory) => (
                      <CategoryName key={parentCategory.slug} category={parentCategory} />
                    ))}
                  </Stack>
                </CardContent>
              )}
            </Card>
          )}
          {members.length > 0 && (
            <LinkList
              header={`Examples of ${category.name}`}
              items={members}
              renderItem={(ingredient) => (
                <LinkListItem
                  key={ingredient.slug}
                  href={
                    ingredientHasData(ingredient)
                      ? getIngredientUrl(ingredient)
                      : undefined
                  }
                  primary={ingredient.name}
                />
              )}
            />
          )}
          {substitutes.length > 0 && (
            <LinkList
              header={`Potential substitutes for ${category.name}`}
              items={substitutes}
              renderItem={(ingredient) => (
                <LinkListItem
                  key={ingredient.slug}
                  href={
                    ingredientHasData(ingredient)
                      ? getIngredientUrl(ingredient)
                      : undefined
                  }
                  primary={ingredient.name}
                />
              )}
            />
          )}
          {additionalVideos.length > 0 && (
            <VideoListCard title="Other videos" refs={additionalVideos} sx={{ m: 1 }} />
          )}
          {relatedRecipes.length > 0 && (
            <LinkList
              header={`Recipes using ${category.name}`}
              items={relatedRecipes}
              renderItem={renderRecipe}
            />
          )}
          <FixBugCard
            fixUrl={`https://github.com/SBoudrias/cocktails/edit/main/src/data/categories/${category.slug}.json`}
            sx={{ m: 1 }}
          />
        </>
      )}
    </>
  );
}
