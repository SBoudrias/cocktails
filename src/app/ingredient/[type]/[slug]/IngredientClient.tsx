'use client';

import AppHeader from '@/components/AppHeader';
import Video from '@/components/Video';
import Link from 'next/link';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { getCategoryUrl, getIngredientUrl, getRecipeUrl } from '@/modules/url';
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
import RecipeList, { getRecipeAttribution } from '@/components/RecipeList';
import { LinkListItem } from '@/components/LinkList';
import Quantity from '@/components/Quantity';
import useNameIsUnique from '@/hooks/useNameIsUnique';
import type { RootIngredient } from '@/types/Ingredient';
import type { Recipe } from '@/types/Recipe';
import { useCallback } from 'react';

export default function IngredientClient({
  ingredient,
  substitutes,
  relatedRecipes,
}: {
  ingredient: RootIngredient;
  substitutes: RootIngredient[];
  relatedRecipes: Recipe[];
}) {
  const recipeNameIsUnique = useNameIsUnique(relatedRecipes);
  const topCategory = ingredient.categories[0];

  const renderRecipe = useCallback(
    (recipe: Recipe) => {
      const ing = recipe.ingredients.find((i) => i.slug === ingredient.slug);
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
    [ingredient.slug, recipeNameIsUnique],
  );

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
      {ingredient.type === 'juice' &&
        'acidity' in ingredient &&
        ingredient.acidity != null && (
          <AcidAdjustingCalculator defaultAcidity={ingredient.acidity} sx={{ m: 1 }} />
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
      {relatedRecipes.length > 0 && (
        <RecipeList
          recipes={relatedRecipes}
          header={`Recipes calling for ${ingredient.name}`}
          renderRecipe={renderRecipe}
        />
      )}
      {videos.length > 0 && (
        <VideoListCard title="Other videos" refs={videos} sx={{ m: 1 }} />
      )}
      <FixBugCard
        fixUrl={`https://github.com/SBoudrias/cocktails/edit/main/src/data/ingredients/${ingredient.type}/${ingredient.slug}.json`}
        sx={{ m: 1 }}
      />
    </>
  );
}
