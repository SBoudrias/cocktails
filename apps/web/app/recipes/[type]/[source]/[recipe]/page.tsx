import { getRecipePageParams } from '@cocktails/data/params';
import type { Metadata } from 'next';
import { DETAIL_SHELL_PARAM } from '#/modules/detailShell';
import RecipeDetail from './RecipeDetail';

type Params = { type: string; source: string; recipe: string };

/**
 * The export holds one shell for every recipe page: the build copies it to
 * each recipe's URL (tools/stamp-detail-pages.ts), and the page renders its
 * own entry of data/recipes.json in the browser. The dev server renders
 * any real recipe path, so it gets them all.
 */
export async function generateStaticParams(): Promise<Params[]> {
  if (process.env.NODE_ENV === 'development') return getRecipePageParams();

  return [
    { type: DETAIL_SHELL_PARAM, source: DETAIL_SHELL_PARAM, recipe: DETAIL_SHELL_PARAM },
  ];
}

// The shell's head is every recipe page's: no per-page title, and no
// canonical (the root layout's would name the shell's own URL). The page
// sets both once its data renders.
export const metadata: Metadata = {
  alternates: { canonical: null },
};

export default function RecipePage() {
  return <RecipeDetail />;
}
