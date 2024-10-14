'use client';

import { Recipe } from '@/types/Recipe';
import { Book } from '@/types/Source';
import { ErrorBlock, IndexBar, List, SearchBar, SearchBarRef } from 'antd-mobile';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function Search({ books, recipes }: { books: Book[]; recipes: Recipe[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<SearchBarRef>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const searchMatches = useMemo(() => {
    if (searchTerm.trim().length === 0) return [];

    return recipes.filter((recipe) => recipe.name.includes(searchTerm));
  }, [searchTerm, books, recipes]);

  let content;
  if (searchMatches.length > 0) {
    content = (
      <List>
        {searchMatches.map((recipe) => (
          <List.Item
            key={recipe.slug}
            onClick={() => router.push(`/recipes/${recipe.source.slug}/${recipe.slug}`)}
          >
            {recipe.name}
          </List.Item>
        ))}
      </List>
    );
  } else if (searchTerm.trim().length > 0) {
    content = <ErrorBlock status="empty" />;
  } else {
    const groups = Object.entries(
      Object.groupBy(recipes, (recipe) => recipe.name[0].toUpperCase()),
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
                    onClick={() =>
                      router.push(`/recipes/${recipe.source.slug}/${recipe.slug}`)
                    }
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
      <div style={{ padding: '12px' }}>
        <SearchBar
          placeholder="Search for a recipe or an ingredient"
          showCancelButton
          onChange={setSearchTerm}
          value={searchTerm}
          ref={searchRef}
        />
      </div>
      {content || <ErrorBlock status="empty" />}
    </>
  );
}
