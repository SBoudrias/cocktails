import { getCategoryPageParams } from '@cocktails/data/params';
import type { Metadata } from 'next';
import { DETAIL_SHELL_PARAM } from '#/modules/detailShell';
import CategoryDetail from './CategoryDetail';

type Params = { slug: string };

/**
 * The export holds one shell for every category page: the build copies it
 * to each category's URL (tools/stamp-detail-pages.ts), and the page
 * renders its own entry of data/categories.json in the browser. The dev
 * server renders any real category path, so it gets them all.
 */
export async function generateStaticParams(): Promise<Params[]> {
  if (process.env.NODE_ENV === 'development') return getCategoryPageParams();

  return [{ slug: DETAIL_SHELL_PARAM }];
}

// The shell's head is every category page's: no per-page title, and no
// canonical (the root layout's would name the shell's own URL). The page
// sets both once its data renders.
export const metadata: Metadata = {
  alternates: { canonical: null },
};

export default function CategoryPage() {
  return <CategoryDetail />;
}
