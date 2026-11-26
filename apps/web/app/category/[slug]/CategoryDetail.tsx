'use client';

import { usePathname } from 'next/navigation';
import FixBugCard from '#/components/card/FixBugCard';
import VideoListCard from '#/components/card/VideoListCard';
import CategoryChips from '#/components/CategoryChips';
import CategoryMembers from '#/components/CategoryMembers';
import DetailPageState from '#/components/DetailPageState';
import { LinkList, LinkListItem } from '#/components/list/LinkList';
import SearchableRecipePage from '#/components/SearchableRecipePage';
import { Card, CardContent } from '#/components/ui/card';
import Video from '#/components/Video';
import { usePageData } from '#/hooks/usePageData';
import { resolveBottleRows } from '#/modules/bottleRows';
import type { CategoryPagesFile } from '#/modules/buildCategoryPages';
import { getLoadedCategoryPages, loadCategoryPages } from '#/modules/categoryPages';
import { getCategoryUrl } from '#/modules/url';

function resolveCategories(slugs: string[], file: CategoryPagesFile) {
  return slugs.flatMap((slug) => {
    const category = file.categories[slug];
    return category ? [{ name: category.name, slug }] : [];
  });
}

function CategoryContent({
  page: { category, recipeCount, ...page },
  file,
}: {
  page: CategoryPagesFile['pages'][string];
  file: CategoryPagesFile;
}) {
  const parents = resolveCategories(page.parents, file);
  const children = resolveCategories(page.children, file);
  const members = resolveBottleRows(page.members, file.bottles);

  const videos = category.refs.filter((ref) => ref.type === 'youtube');
  const [firstVideo, ...additionalVideos] = videos;

  return (
    <SearchableRecipePage
      title={category.name}
      catalogKey={recipeCount > 0 ? `category/${category.slug}` : undefined}
      recipeCount={recipeCount}
      listHeader={`Recipes using ${category.name}`}
      underTitle={<CategoryChips categories={parents} label="Parent categories" />}
      footer={
        <FixBugCard
          fixUrl={`https://github.com/SBoudrias/cocktails/edit/main/src/data/categories/${category.slug}.json`}
          m={1}
        />
      }
    >
      {firstVideo && <Video id={firstVideo.videoId} start={firstVideo.start} />}
      {category.description && (
        <Card m={1}>
          <CardContent>
            <p>{category.description}</p>
          </CardContent>
        </Card>
      )}
      {children.length > 0 && (
        <LinkList
          header={`Subcategories of ${category.name}`}
          items={children}
          renderItem={(childCategory) => (
            <LinkListItem
              key={childCategory.slug}
              href={getCategoryUrl(childCategory)}
              primary={childCategory.name}
            />
          )}
        />
      )}
      <CategoryMembers category={category} members={members} />
      {additionalVideos.length > 0 && (
        <VideoListCard title="Other videos" refs={additionalVideos} m={1} />
      )}
    </SearchableRecipePage>
  );
}

/**
 * A category page, rendered in the browser from the category data file
 * (data/categories.json): every category URL serves the same exported
 * shell, and the page picks its entry by its own path.
 */
export default function CategoryDetail() {
  const pathname = usePathname();
  const { file, missing, failed } = usePageData(pathname, {
    load: loadCategoryPages,
    getLoaded: getLoadedCategoryPages,
  });
  const page = file?.pages[pathname];

  if (missing) return <DetailPageState state="missing" />;
  if (file == null || page == null) {
    return <DetailPageState state={failed ? 'failed' : 'loading'} />;
  }

  return <CategoryContent page={page} file={file} />;
}
