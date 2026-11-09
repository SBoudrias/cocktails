'use client';

import { useQueryState } from 'nuqs';
import AllRecipesSearch from '#/components/AllRecipesSearch';
import LetterNav from '#/components/LetterNav';
import { LinkList, LinkListItem } from '#/components/LinkList';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
import SearchHeader from '#/components/SearchHeader';
import { byNameListConfig } from '#/modules/lists/by-name';
import type { RecipeListItem } from '#/modules/recipeListItem';
import { getRecipeLetterUrl } from '#/modules/url';

type Letter = { slug: string; label: string; count: number };

function renderLetter(letter: Letter) {
  return (
    <LinkListItem
      key={letter.slug}
      href={getRecipeLetterUrl(letter.slug)}
      primary={letter.label}
      secondary={`${letter.count} ${letter.count === 1 ? 'recipe' : 'recipes'}`}
    />
  );
}

function renderRecipe(recipe: RecipeListItem) {
  return (
    <RecipeLinkListItem
      key={recipe.href}
      href={recipe.href}
      name={recipe.name}
      source={recipe.source}
    />
  );
}

/**
 * The recipe list, split in letter pages. Without `page` it is the index of
 * letters. A search always covers every recipe, from the shared search index.
 */
export default function RecipesClient({
  title,
  letters,
  page,
}: {
  title: string;
  letters: Letter[];
  page?: { letter: string; recipes: RecipeListItem[] };
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  const isSearching = searchTerm != null && searchTerm.trim() !== '';

  return (
    <>
      <SearchHeader
        title={title}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      {isSearching ? (
        <AllRecipesSearch searchTerm={searchTerm} />
      ) : page ? (
        <>
          <LetterNav letters={letters} current={page.letter} />
          <LinkList
            items={page.recipes}
            config={byNameListConfig}
            renderItem={renderRecipe}
          />
        </>
      ) : (
        <LinkList header="Recipes by letter" items={letters} renderItem={renderLetter} />
      )}
    </>
  );
}
