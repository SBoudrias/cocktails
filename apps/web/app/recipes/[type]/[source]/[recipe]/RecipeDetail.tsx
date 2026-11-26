'use client';

import type { Recipe, WebsiteRef, YoutubeRef } from '@cocktails/data';
import { usePathname } from 'next/navigation';
import { match, P } from 'ts-pattern';
import AppHeader from '#/components/AppHeader';
import FixBugCard from '#/components/card/FixBugCard';
import SourceAboutCard from '#/components/card/SourceAboutCard';
import VideoListCard from '#/components/card/VideoListCard';
import DetailPageState from '#/components/DetailPageState';
import IngredientList from '#/components/IngredientList';
import InstructionList from '#/components/InstructionList';
import { usePageData } from '#/hooks/usePageData';
import {
  getLoadedRecipePages,
  loadRecipePages,
  resolveRecipe,
} from '#/modules/recipePages';
import { getRecipeEditUrl } from '#/modules/url';
import RecipeAttributionList from './RecipeAttributionList';
import RecipeBadges from './RecipeBadges';
import WebsiteListCard from './WebsiteListCard';

function RecipeContent({ recipe }: { recipe: Recipe }) {
  // Every ref type is handled explicitly: adding one to the Ref union in
  // @cocktails/data becomes a compile error here instead of a silently
  // unrendered ref. Book and podcast refs render in the source card — the book
  // ref names this recipe's chapter, podcast refs the episode — so neither
  // gets a dedicated section on the recipe page.
  const { videos, websites } = recipe.refs.reduce<{
    videos: YoutubeRef[];
    websites: WebsiteRef[];
  }>(
    (acc, ref) => {
      match(ref)
        .with({ type: 'youtube' }, (youtubeRef) => {
          acc.videos.push(youtubeRef);
        })
        .with({ type: 'website' }, (websiteRef) => {
          acc.websites.push(websiteRef);
        })
        .with(P.union({ type: 'book' }, { type: 'podcast' }), () => {})
        .exhaustive();
      return acc;
    },
    { videos: [], websites: [] },
  );
  if (recipe.source.type === 'youtube-channel') {
    // For youtube channels, the first video is always in the source card.
    videos.shift();
  }

  return (
    <>
      <AppHeader title={recipe.name} />
      {/* The root layout carries the one <main> landmark; per-page mains
          would nest (Lighthouse landmark-one-main). */}
      <div>
        <RecipeBadges recipe={recipe} />
        <IngredientList
          ingredients={recipe.ingredients}
          techniques={recipe.techniques}
          defaultServings={recipe.servings}
        />
        {Array.isArray(recipe.instructions) && recipe.instructions.length > 0 && (
          <InstructionList instructions={recipe.instructions} />
        )}
        {recipe.attributions.length > 0 && (
          <RecipeAttributionList attributions={recipe.attributions} />
        )}
        <SourceAboutCard
          source={recipe.source}
          chapterName={recipe.chapter?.name}
          refs={recipe.refs}
          m={1}
        />
        {videos.length > 0 && <VideoListCard refs={videos} m={1} />}
        {websites.length > 0 && <WebsiteListCard refs={websites} m={1} />}
        <FixBugCard fixUrl={getRecipeEditUrl(recipe)} m={1} />
      </div>
    </>
  );
}

/**
 * A recipe page, rendered in the browser from the recipe data file
 * (data/recipes.json): every recipe URL serves the same exported shell, and
 * the page picks its entry by its own path.
 */
export default function RecipeDetail() {
  const pathname = usePathname();
  const { file, missing, failed } = usePageData(pathname, {
    load: loadRecipePages,
    getLoaded: getLoadedRecipePages,
  });
  const page = file?.pages[pathname];
  const recipe = file && page && resolveRecipe(page, file);

  if (missing || (page != null && recipe == null)) {
    return <DetailPageState state="missing" />;
  }
  if (recipe == null) return <DetailPageState state={failed ? 'failed' : 'loading'} />;

  return <RecipeContent recipe={recipe} />;
}
