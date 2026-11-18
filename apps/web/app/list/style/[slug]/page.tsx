import {
  getRecipeStyle,
  getRecipeStyles,
  getRecipesByStyle,
} from '@cocktails/data/styles';
import type { Metadata } from 'next';
import { notFound, unstable_rethrow } from 'next/navigation';
import SearchableRecipePage from '#/components/SearchableRecipePage';
import { Card, CardContent } from '#/components/ui/card';

type Params = { slug: string };

async function getStylePageData(slug: string) {
  try {
    // getRecipeStyle throws on an unknown slug; getRecipesByStyle loads.
    const style = getRecipeStyle(slug);
    const recipes = await getRecipesByStyle(slug);

    return { style, recipes };
  } catch (error) {
    // The loaders throw only on an unknown slug: that renders notFound.
    unstable_rethrow(error);
    return null;
  }
}

export async function generateStaticParams(): Promise<Params[]> {
  const pages = await Promise.all(
    getRecipeStyles().map(async (style) => ({
      slug: style.slug,
      // A style nothing in the corpus matches renders no page.
      hasRecipes: (await getRecipesByStyle(style.slug)).length > 0,
    })),
  );

  return pages.flatMap(({ slug, hasRecipes }) => (hasRecipes ? [{ slug }] : []));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getStylePageData(slug);

  if (page == null) return { title: 'Style Not Found' };

  return {
    title: `Indexotica | ${page.style.name} Recipes`,
    description: `${page.style.description} ${page.recipes.length} recipes.`,
  };
}

export default async function StyleRecipesPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const page = await getStylePageData(slug);

  if (page == null || page.recipes.length === 0) {
    notFound();
  }

  const { style, recipes } = page;

  return (
    <SearchableRecipePage
      title={`${style.name} Recipes`}
      catalogKey={`list/style/${style.slug}`}
      recipeCount={recipes.length}
      listHeader="All Recipes"
    >
      <Card m={2}>
        <CardContent>
          <p>{style.description}</p>
        </CardContent>
      </Card>
    </SearchableRecipePage>
  );
}
