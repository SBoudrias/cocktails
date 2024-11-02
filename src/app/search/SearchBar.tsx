'use client';

import { Recipe } from '@/types/Recipe';
import { ErrorBlock, IndexBar, List, SearchBar, SearchBarRef, Space } from 'antd-mobile';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import uFuzzy from '@leeoniya/ufuzzy';
import styles from './search.module.css';
import Link from 'next/link';
import { LeftOutline } from 'antd-mobile-icons';
import { getRecipeUrl } from '@/modules/url';

export default function Search({ recipes }: { recipes: Recipe[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<SearchBarRef>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

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
          <List.Item key={recipe.slug} onClick={() => router.push(getRecipeUrl(recipe))}>
            {recipe.name}
          </List.Item>
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
                  <List.Item
                    key={recipe.slug}
                    onClick={() => router.push(getRecipeUrl(recipe))}
                  >
                    {recipe.name}
                  </List.Item>
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
        <Link href="/">
          <LeftOutline fontSize="24px" />
        </Link>
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
