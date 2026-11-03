'use client';

import type { RootIngredient } from '@cocktails/data';
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
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import AppHeader from '#/components/AppHeader';
import CategoryName from '#/components/CategoryName';
import FixBugCard from '#/components/FixBugCard';
import IngredientList from '#/components/IngredientList';
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
import IngredientCalculators from './IngredientCalculators';

export default function IngredientClient({
  ingredient,
  substitutes,
  relatedRecipes,
}: {
  ingredient: RootIngredient;
  substitutes: RootIngredient[];
  relatedRecipes: RecipeCardItem[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  const topCategory = ingredient.categories[0];
  const isSearching = searchTerm != null && searchTerm.trim() !== '';

  const { firstVideo, additionalVideos } = useMemo(() => {
    const allRefs = [
      ...ingredient.refs,
      ...ingredient.categories.flatMap((c) => c.refs ?? []),
    ];
    const videos = uniqBy(
      allRefs.filter((ref) => ref.type === 'youtube'),
      'videoId',
    );
    return {
      firstVideo: videos[0],
      additionalVideos: videos.slice(1),
    };
  }, [ingredient.refs, ingredient.categories]);

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
    );
  }

  return (
    <>
      {relatedRecipes.length > 0 ? (
        <SearchHeader
          title={ingredient.name}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      ) : (
        <AppHeader title={ingredient.name} />
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
          {descriptionCard}
          {ingredient.ingredients.length > 0 && (
            <IngredientList ingredients={ingredient.ingredients} />
          )}
          {Array.isArray(ingredient.instructions) &&
            ingredient.instructions.length > 0 && (
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
          {substitutes.length > 0 && (
            <LinkList
              header="Some substitution option"
              items={substitutes.slice(0, 10)}
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
            />
          )}
          {additionalVideos.length > 0 && (
            <VideoListCard title="Other videos" refs={additionalVideos} sx={{ m: 1 }} />
          )}
          {relatedRecipes.length > 0 && (
            <LinkList
              header={`Recipes using ${ingredient.name}`}
              items={relatedRecipes}
              renderItem={renderRecipe}
            />
          )}
          <FixBugCard
            fixUrl={`https://github.com/SBoudrias/cocktails/edit/main/src/data/ingredients/${ingredient.type}/${ingredient.slug}.json`}
            sx={{ m: 1 }}
          />
        </>
      )}
    </>
  );
}
