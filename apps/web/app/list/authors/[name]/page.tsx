import { getAuthor } from '@cocktails/data/authors';
import { getAllRecipes, getRecipesByAuthor } from '@cocktails/data/recipes';
import slugify from '@sindresorhus/slugify';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AuthorAboutCard } from '#/components/EntityAboutCard';
import SearchableRecipePage from '#/components/SearchableRecipePage';

type Props = {
  params: Promise<{ name: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const author = await getAuthor(name);

  if (!author) {
    return {
      title: 'Author Not Found',
    };
  }

  return {
    title: `Indexotica | Recipes by ${author.name}`,
    description:
      author.description ?? `Cocktail recipes created or adapted by ${author.name}.`,
  };
}

export async function generateStaticParams() {
  const allRecipes = await getAllRecipes();
  const params = new Set<string>();

  for (const recipe of allRecipes) {
    for (const attribution of recipe.attributions) {
      if (
        attribution.relation === 'recipe author' ||
        attribution.relation === 'adapted by'
      ) {
        params.add(slugify(attribution.source));
      }
    }
  }

  return Array.from(params).map((name) => ({ name }));
}

export default async function AuthorRecipesPage({ params }: Props) {
  const { name } = await params;
  const author = await getAuthor(name);

  // getAuthor falls back to the recipes' attributions when the entity file is
  // missing, so no match means no author by that slug is credited anywhere.
  if (!author) {
    notFound();
  }

  const authorRecipes = await getRecipesByAuthor(author);

  if (authorRecipes.length === 0) {
    notFound();
  }

  // getAuthor resolves the entity's bars/sources refs into full entities, so
  // the card renders every dimension of the author from its one object.
  return (
    <SearchableRecipePage
      catalogKey={`list/authors/${author.slug}`}
      recipeCount={authorRecipes.length}
      listHeader={`Recipes by ${author.name}`}
    >
      <AuthorAboutCard author={author} sx={{ m: 2 }} />
    </SearchableRecipePage>
  );
}
