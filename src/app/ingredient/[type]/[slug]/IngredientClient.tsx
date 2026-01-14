'use client';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
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
import { uniqBy } from 'lodash';
import Link from 'next/link';
import { useQueryState } from 'nuqs';
import { useCallback } from 'react';
import type { RootIngredient } from '@/types/Ingredient';
import type { Recipe } from '@/types/Recipe';
import AcidAdjustingCalculator from '@/components/AcidAdjustingCalculator';
import CategoryName from '@/components/CategoryName';
import FixBugCard from '@/components/FixBugCard';
import IngredientList from '@/components/IngredientList';
import { LinkListItem } from '@/components/LinkList';
import Quantity from '@/components/Quantity';
import { getRecipeAttribution } from '@/components/RecipeList';
import SearchableList from '@/components/SearchableList';
import SearchAllLink from '@/components/SearchAllLink';
import SearchHeader from '@/components/SearchHeader';
import Video from '@/components/Video';
import VideoListCard from '@/components/VideoListCard';
import useNameIsUnique from '@/hooks/useNameIsUnique';
import { ingredientHasData } from '@/modules/hasData';
import { getRecipeSearchText } from '@/modules/searchText';
import { getCategoryUrl, getIngredientUrl, getRecipeUrl } from '@/modules/url';

export default function IngredientClient({
  ingredient,
  substitutes,
  relatedRecipes,
}: {
  ingredient: RootIngredient;
  substitutes: RootIngredient[];
  relatedRecipes: Recipe[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  const recipeNameIsUnique = useNameIsUnique(relatedRecipes);
  const topCategory = ingredient.categories[0];
  const isSearching = Boolean(searchTerm);

  const renderRecipe = useCallback(
    (recipe: Recipe) => {
      const ing = recipe.ingredients.find((i) => i.slug === ingredient.slug);
      const href = getRecipeUrl(recipe);

      return (
        <LinkListItem
          // Using href as key since recipe `slug`s aren't unique
          key={href}
          href={href}
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

  const renderSearchItem = useCallback(
    (items: Recipe[], header?: string) => {
      const headerId = header ? `group-header-${header}` : undefined;

      return (
        <List role={header ? 'group' : undefined} aria-labelledby={headerId}>
          {header && <ListSubheader id={headerId}>{header}</ListSubheader>}
          <Paper square>{items.map(renderRecipe)}</Paper>
        </List>
      );
    },
    [renderRecipe],
  );

  const emptyState = (
    <>
      <Card sx={{ m: 2 }}>
        <CardHeader title="No results found" />
      </Card>
      <SearchAllLink searchTerm={searchTerm} />
    </>
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
      <SearchHeader
        title={ingredient.name}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      {!isSearching && (
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
          {ingredient.type === 'juice' &&
            'acidity' in ingredient &&
            ingredient.acidity != null && (
              <AcidAdjustingCalculator
                defaultAcidity={ingredient.acidity}
                sx={{ m: 1 }}
              />
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
        </>
      )}
      {relatedRecipes.length > 0 && (
        <SearchableList
          items={relatedRecipes}
          getSearchText={getRecipeSearchText}
          renderItem={renderSearchItem}
          searchTerm={searchTerm}
          emptyState={emptyState}
        />
      )}
      {!isSearching && (
        <>
          {videos.length > 0 && (
            <VideoListCard title="Other videos" refs={videos} sx={{ m: 1 }} />
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
