'use client';

import { useQueryState } from 'nuqs';
import AllRecipesSearch from '#/components/AllRecipesSearch';
import LetterNav from '#/components/LetterNav';
import { LinkList } from '#/components/LinkList';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
import SearchHeader from '#/components/SearchHeader';
import { byNameListConfig } from '#/modules/lists/by-name';
import type { RecipeListItem } from '#/modules/recipeListItem';

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
 * One letter of the recipe list: a small static entry point next to the full
 * list. It only holds its own recipes, so a search covers every recipe, from
 * the shared search index.
 */
export default function LetterRecipesClient({
  title,
  letters,
  letter,
  recipes,
}: {
  title: string;
  letters: { slug: string; label: string }[];
  letter: string;
  recipes: RecipeListItem[];
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
      ) : (
        <>
          <LetterNav letters={letters} current={letter} />
          <LinkList items={recipes} config={byNameListConfig} renderItem={renderRecipe} />
        </>
      )}
    </>
  );
}
