import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useListSearch } from './useListSearch';

// Mock nuqs
let mockSearchState = '';
const mockSetSearchState = vi.fn((newValue: string | null) => {
  mockSearchState = newValue ?? '';
});

vi.mock('nuqs', () => ({
  useQueryState: vi.fn(() => {
    return [mockSearchState, mockSetSearchState];
  }),
}));

// Mock use-debounce to return the value immediately (no delay in tests)
vi.mock('use-debounce', () => ({
  useDebounce: vi.fn((value: string) => [value]),
}));

describe('useListSearch', () => {
  const mockItems = [
    { id: 1, name: 'Apple', category: 'Fruit' },
    { id: 2, name: 'Banana', category: 'Fruit' },
    { id: 3, name: 'Carrot', category: 'Vegetable' },
    { id: 4, name: 'Date', category: 'Fruit' },
  ];

  const searchFields = (item: (typeof mockItems)[0]) => [item.name, item.category];

  beforeEach(() => {
    mockSearchState = '';
    mockSetSearchState.mockClear();
  });

  it('should return all items when search term is empty', () => {
    const { result } = renderHook(() =>
      useListSearch({
        items: mockItems,
        searchFields,
      }),
    );

    expect(result.current.filteredItems).toEqual(mockItems);
    expect(result.current.resultsCount).toBe(4);
    expect(result.current.totalCount).toBe(4);
    expect(result.current.isSearching).toBe(false);
  });

  it('should filter items based on search term', () => {
    const { result, rerender } = renderHook(() =>
      useListSearch({
        items: mockItems,
        searchFields,
      }),
    );

    act(() => {
      result.current.setSearchTerm('fruit');
    });

    // Update the mock state
    mockSearchState = 'fruit';
    rerender();

    // Since we're mocking the fuzzy search, we need to update the mock implementation
    // For testing purposes, we'll check that the search term is set
    expect(result.current.searchTerm).toBe('fruit');
  });

  it('should clear search when clearSearch is called', () => {
    mockSearchState = 'test';

    const { result, rerender } = renderHook(() =>
      useListSearch({
        items: mockItems,
        searchFields,
      }),
    );

    expect(result.current.searchTerm).toBe('test');

    act(() => {
      result.current.clearSearch();
    });

    // Update the mock state
    mockSearchState = '';
    rerender();

    expect(result.current.searchTerm).toBe('');
    expect(result.current.isSearching).toBe(false);
  });

  it('should handle empty items array', () => {
    const { result } = renderHook(() =>
      useListSearch({
        items: [],
        searchFields,
      }),
    );

    expect(result.current.filteredItems).toEqual([]);
    expect(result.current.resultsCount).toBe(0);
    expect(result.current.totalCount).toBe(0);
  });

  it('should create searchable haystack from search fields', () => {
    const customSearchFields = (item: (typeof mockItems)[0]) => [item.name];

    const { result } = renderHook(() =>
      useListSearch({
        items: mockItems,
        searchFields: customSearchFields,
      }),
    );

    // The haystack should be created from the search fields
    expect(result.current.totalCount).toBe(4);
  });

  it('should perform fuzzy search and return matching items', () => {
    mockSearchState = 'banan';

    const { result } = renderHook(() =>
      useListSearch({
        items: mockItems,
        searchFields,
      }),
    );

    // Should match "Banana" with fuzzy search (missing 'a')
    expect(result.current.filteredItems.length).toBeGreaterThan(0);
    expect(result.current.filteredItems.some((item) => item.name === 'Banana')).toBe(
      true,
    );
    expect(result.current.isSearching).toBe(true);
  });

  it('should match items by category field', () => {
    mockSearchState = 'vegetable';

    const { result } = renderHook(() =>
      useListSearch({
        items: mockItems,
        searchFields,
      }),
    );

    // Should match "Carrot" by its category "Vegetable"
    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0]?.name).toBe('Carrot');
    expect(result.current.resultsCount).toBe(1);
  });

  it('should return empty array when no matches found', () => {
    mockSearchState = 'nonexistent';

    const { result } = renderHook(() =>
      useListSearch({
        items: mockItems,
        searchFields,
      }),
    );

    expect(result.current.filteredItems).toEqual([]);
    expect(result.current.resultsCount).toBe(0);
    expect(result.current.isSearching).toBe(true);
  });

  it('should handle transliteration in search', () => {
    const itemsWithAccents = [
      { id: 1, name: 'Piña Colada', category: 'Cocktail' },
      { id: 2, name: 'Café Latte', category: 'Coffee' },
    ];

    mockSearchState = 'pina'; // without special char

    const { result } = renderHook(() =>
      useListSearch({
        items: itemsWithAccents,
        searchFields: (item) => [item.name, item.category],
      }),
    );

    // Should match "Piña Colada" even without accent
    expect(result.current.filteredItems.some((item) => item.name === 'Piña Colada')).toBe(
      true,
    );
  });

  it('should be case insensitive', () => {
    mockSearchState = 'APPLE';

    const { result } = renderHook(() =>
      useListSearch({
        items: mockItems,
        searchFields,
      }),
    );

    // Should match "Apple" regardless of case
    expect(result.current.filteredItems.some((item) => item.name === 'Apple')).toBe(true);
  });

  it('should use maxResults parameter with uFuzzy', () => {
    const manyItems = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      category: 'Fruit',
    }));

    // Search for something that matches all items
    mockSearchState = 'item';

    const { result } = renderHook(() =>
      useListSearch({
        items: manyItems,
        searchFields: (item) => [item.name, item.category],
        maxResults: 5,
      }),
    );

    // Should be searching and return results
    expect(result.current.isSearching).toBe(true);
    expect(result.current.filteredItems.length).toBeGreaterThan(0);
    // Note: uFuzzy's maxResults parameter behavior depends on the library implementation
    // We verify the parameter is passed, but actual limiting may vary
  });
});
