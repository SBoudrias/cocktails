'use client';

import { Recipe } from '@/types/Recipe';
import { ErrorBlock, IndexBar, List, SearchBar, SearchBarRef, Space } from 'antd-mobile';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import uFuzzy from '@leeoniya/ufuzzy';
import styles from './search.module.css';
import { getRecipeUrl } from '@/modules/url';

function RecipeLine({ recipe, isUnique }: { recipe: Recipe; isUnique: boolean }) {
  const router = useRouter();

  return (
    <List.Item onClick={() => router.push(getRecipeUrl(recipe))}>
      <Space align="baseline">
        <div className={styles.recipeName}>{recipe.name}</div>
        {!isUnique && <div className={styles.recipeSource}>{recipe.source.name}</div>}
      </Space>
    </List.Item>
  );
}

export default function Search({ recipes }: { recipes: Recipe[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<SearchBarRef>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const nameIsUnique = useMemo(() => {
    // Normalize names to lower case to avoid case sensitivity
    const store = Object.groupBy(recipes, (recipe) => recipe.name.toLowerCase());
    return (name: string) => store[name.toLowerCase()]?.length === 1;
  }, [recipes]);

  const haystack = useMemo(
    () =>
      recipes.map((recipe) => {
        return `${recipe.name} ${recipe.ingredients.map((ingredient) => `${ingredient.name} ${ingredient.categories?.join(' ')}`).join(' ')}`.toLowerCase();
      }),
    [recipes],
  );

  const searchMatches = useMemo(() => {
    if (searchTerm.trim().length === 0) return [];

    const uf = new uFuzzy();
    const [matchIndexes] = uf.search(haystack, searchTerm.toLowerCase(), 0, 1e3);

    if (Array.isArray(matchIndexes) && matchIndexes.length > 0) {
      return matchIndexes
        .map((index) => recipes[index])
        .filter((recipe) => recipe != null);
    }

    // No matches found
    return [];
  }, [haystack, recipes, searchTerm]);

  let content;
  if (searchMatches.length > 0) {
    content = (
      <List>
        {searchMatches.map((recipe) => (
          <RecipeLine
            key={getRecipeUrl(recipe)}
            recipe={recipe}
            isUnique={nameIsUnique(recipe.name)}
          />
        ))}
      </List>
    );
  } else if (searchTerm.trim().length > 0) {
    content = <ErrorBlock status="empty" />;
  } else {
    const firstLetterRegExp = /^(the |a )?([a-z])/i;
    const groups = Object.entries(
      Object.groupBy(recipes, (recipe) => {
        const matches = recipe.name.match(firstLetterRegExp) ?? [];
        return matches[2]?.toUpperCase() ?? '#';
      }),
    ).sort(([a], [b]) => a.localeCompare(b));

    content = (
      <IndexBar>
        {groups.map(([letter, recipes]) => {
          if (!recipes) return;

          return (
            <IndexBar.Panel index={letter} title={letter} key={letter}>
              <List>
                {recipes.map((recipe) => (
                  <RecipeLine
                    key={getRecipeUrl(recipe)}
                    recipe={recipe}
                    isUnique={nameIsUnique(recipe.name)}
                  />
                ))}
              </List>
            </IndexBar.Panel>
          );
        })}
      </IndexBar>
    );
  }

  return (
    <>
      <Space className={styles.searchBar} style={{ width: '100%', '--gap': '8px' }}>
        <SearchBar
          placeholder="Search for a recipe or an ingredient"
          showCancelButton
          onChange={setSearchTerm}
          value={searchTerm}
          ref={searchRef}
        />
      </Space>
      {content || <ErrorBlock status="empty" />}
    </>
  );
}
