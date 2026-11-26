'use client';

import uniqBy from 'lodash/uniqBy';
import { Tag } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import FixBugCard from '#/components/card/FixBugCard';
import VideoListCard from '#/components/card/VideoListCard';
import CategoryChips from '#/components/CategoryChips';
import DetailPageState from '#/components/DetailPageState';
import IngredientList from '#/components/IngredientList';
import InstructionList from '#/components/InstructionList';
import SearchableRecipePage from '#/components/SearchableRecipePage';
import type { SubstituteRow } from '#/components/SubstitutionLists';
import SubstitutionSection from '#/components/SubstitutionSection';
import { buttonVariants } from '#/components/ui/button-variants';
import {
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import Video from '#/components/Video';
import { usePageData } from '#/hooks/usePageData';
import type { IngredientPagesFile } from '#/modules/buildIngredientPages';
import { getLoadedIngredientPages, loadIngredientPages } from '#/modules/ingredientPages';
import { getCategoryUrl, getIngredientUrl } from '#/modules/url';
import IngredientCalculators from './IngredientCalculators';

type PageEntry = IngredientPagesFile['pages'][string];

function IngredientContent({
  page: { ingredient, recipeCount, ...page },
  file,
}: {
  page: PageEntry;
  file: IngredientPagesFile;
}) {
  const categories = ingredient.categories.flatMap((slug) => {
    const category = file.categories[slug];
    return category ? [{ ...category, slug }] : [];
  });
  const substitutes: SubstituteRow[] = page.substitutes.flatMap((slug) => {
    const bottle = file.bottles[slug];
    if (bottle == null) return [];
    const [name, type, hasPage, count] = bottle;
    return [
      { name, slug, count, href: hasPage ? getIngredientUrl({ type, slug }) : undefined },
    ];
  });
  const relatedCategories = page.relatedCategories.flatMap((slug) => {
    const category = file.categories[slug];
    return category ? [{ name: category.name, slug }] : [];
  });

  const topCategory = categories[0];
  const [firstVideo, ...additionalVideos] = uniqBy(
    [...ingredient.refs, ...categories.flatMap((c) => c.refs)].filter(
      (ref) => ref.type === 'youtube',
    ),
    'videoId',
  );

  return (
    <SearchableRecipePage
      title={ingredient.name}
      catalogKey={
        recipeCount > 0 ? `ingredient/${ingredient.type}/${ingredient.slug}` : undefined
      }
      recipeCount={recipeCount}
      listHeader={`Recipes using ${ingredient.name}`}
      underTitle={
        <>
          <CategoryChips categories={categories} />
          <SubstitutionSection
            ingredientName={ingredient.name}
            substitutes={substitutes}
            relatedCategories={relatedCategories}
          />
        </>
      }
      footer={
        <FixBugCard
          fixUrl={`https://github.com/SBoudrias/cocktails/edit/main/src/data/ingredients/${ingredient.type}/${ingredient.slug}.json`}
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

/**
 * An ingredient page, rendered in the browser from the ingredient data file
 * (data/ingredients.json): every ingredient URL serves the same exported
 * shell, and the page picks its entry by its own path.
 */
export default function IngredientDetail() {
  const pathname = usePathname();
  const { file, missing, failed } = usePageData(pathname, {
    load: loadIngredientPages,
    getLoaded: getLoadedIngredientPages,
  });
  const page = file?.pages[pathname];

  if (missing) return <DetailPageState state="missing" />;
  if (file == null || page == null) {
    return <DetailPageState state={failed ? 'failed' : 'loading'} />;
  }

  return <IngredientContent page={page} file={file} />;
}
