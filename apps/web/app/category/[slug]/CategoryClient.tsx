'use client';

import type { Category, RootIngredient } from '@cocktails/data';
import { Card, CardContent, CardHeader, Stack } from '@mui/material';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import AppHeader from '#/components/AppHeader';
import CategoryName from '#/components/CategoryName';
import FixBugCard from '#/components/FixBugCard';
import { LinkList, LinkListItem } from '#/components/LinkList';
import Quantity from '#/components/Quantity';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
import SearchableList from '#/components/SearchableList';
import SearchAllLink from '#/components/SearchAllLink';
import SearchHeader from '#/components/SearchHeader';
import Video from '#/components/Video';
import VideoListCard from '#/components/VideoListCard';
import { ingredientHasData } from '#/modules/hasData';
import type { RecipeCardItem } from '#/modules/recipeCard';
import { getCategoryUrl, getIngredientUrl } from '#/modules/url';

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
  relatedRecipes: RecipeCardItem[];
  childCategories: Category[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  const isSearching = searchTerm != null && searchTerm.trim() !== '';

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

  const renderRecipe = useCallback((recipe: RecipeCardItem) => {
    return (
      <RecipeLinkListItem
        key={recipe.href}
        href={recipe.href}
        name={recipe.name}
        source={recipe.source}
        tertiary={
          recipe.quantity && <Quantity quantity={recipe.quantity} preferredUnit="oz" />
        }
      />
    );
  }, []);

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
          getSearchText={(recipe) => recipe.searchText}
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
