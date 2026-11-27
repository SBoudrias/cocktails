import { getIngredientPageParams } from '@cocktails/data/params';
import type { Metadata } from 'next';
import { DETAIL_SHELL_PARAM } from '#/modules/detailShell';
import IngredientDetail from './IngredientDetail';

type Params = { type: string; slug: string };

/**
 * The export holds one shell for every ingredient page: the build copies it
 * to each ingredient's URL (tools/stamp-detail-pages.ts), and the page
 * renders its own entry of data/ingredients.json in the browser. The dev
 * server renders any real ingredient path, so it gets them all.
 */
export async function generateStaticParams(): Promise<Params[]> {
  if (process.env.NODE_ENV === 'development') return getIngredientPageParams();

  return [{ type: DETAIL_SHELL_PARAM, slug: DETAIL_SHELL_PARAM }];
}

// The shell's head is every ingredient page's: no per-page title, and no
// canonical (the root layout's would name the shell's own URL). The page
// sets both once its data renders.
export const metadata: Metadata = {
  alternates: { canonical: null },
};

export default function IngredientPage() {
  return <IngredientDetail />;
}
