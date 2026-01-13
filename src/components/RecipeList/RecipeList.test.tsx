import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecipeList, { getRecipeAttribution } from './index';
import { LinkListItem } from '../LinkList';
import { getRecipeUrl } from '@/modules/url';
import type { Recipe } from '@/types/Recipe';

let recipeCounter = 0;

const mockRecipe = (
  name: string,
  attributions: Recipe['attributions'] = [],
  sourceType: Recipe['source']['type'] = 'book',
): Recipe => ({
  name,
  slug: `recipe-${++recipeCounter}`,
  source: {
    type: sourceType,
    name: 'Test Source',
    slug: 'test-source',
    link: 'https://example.com',
    description: 'Test description',
    recipeAmount: 1,
  },
  attributions,
  ingredients: [],
  preparation: 'shaken',
  served_on: 'up',
  glassware: 'coupe',
  refs: [],
});

describe('getRecipeAttribution', () => {
  it('prioritizes "adapted by" over "recipe author" for book sources', () => {
    const recipe = mockRecipe(
      'Test Recipe',
      [
        { relation: 'recipe author', source: 'Original Author' },
        { relation: 'adapted by', source: 'Adapter' },
      ],
      'book',
    );

    expect(getRecipeAttribution(recipe)).toBe('Adapter | Test Source');
  });

  it('prioritizes "adapted by" over "bar" for book sources', () => {
    const recipe = mockRecipe(
      'Test Recipe',
      [
        { relation: 'bar', source: 'Some Bar' },
        { relation: 'adapted by', source: 'Adapter' },
      ],
      'book',
    );

    expect(getRecipeAttribution(recipe)).toBe('Adapter | Test Source');
  });

  it('prioritizes "recipe author" over "bar" for book sources', () => {
    const recipe = mockRecipe(
      'Test Recipe',
      [
        { relation: 'bar', source: 'Some Bar' },
        { relation: 'recipe author', source: 'Author' },
      ],
      'book',
    );

    expect(getRecipeAttribution(recipe)).toBe('Author | Test Source');
  });

  it('uses source name for bar attribution with book sources', () => {
    const recipe = mockRecipe(
      'Test Recipe',
      [{ relation: 'bar', source: 'Some Bar' }],
      'book',
    );

    expect(getRecipeAttribution(recipe)).toBe('Test Source');
  });

  it('uses source name when no attributions exist', () => {
    const recipe = mockRecipe('Test Recipe', [], 'book');

    expect(getRecipeAttribution(recipe)).toBe('Test Source');
  });

  it('handles non-book sources with adapted by attribution', () => {
    const recipe = mockRecipe(
      'Test Recipe',
      [{ relation: 'adapted by', source: 'Adapter' }],
      'podcast',
    );

    expect(getRecipeAttribution(recipe)).toBe('Adapter');
  });

  it('handles bar attribution with non-book sources', () => {
    const recipe = mockRecipe(
      'Test Recipe',
      [{ relation: 'bar', source: 'Some Bar' }],
      'podcast',
    );

    expect(getRecipeAttribution(recipe)).toBe('served at Some Bar');
  });
});

describe('RecipeList rendering', () => {
  it('renders recipe names with default renderRecipe', () => {
    const recipe = mockRecipe('Unique Recipe', [], 'book');

    render(<RecipeList recipes={[recipe]} />);

    const listItem = screen.getByRole('listitem');
    expect(listItem).toHaveTextContent('Unique Recipe');
  });

  it('renders custom content when renderRecipe is provided', () => {
    const recipe = mockRecipe('Test Recipe', [], 'book');

    render(
      <RecipeList
        recipes={[recipe]}
        renderRecipe={(r) => (
          <LinkListItem
            key={r.slug}
            href={getRecipeUrl(r)}
            primary={r.name}
            secondary="Custom secondary text"
          />
        )}
      />,
    );

    const listItem = screen.getByRole('listitem');
    expect(listItem).toHaveTextContent('Test Recipe');
    expect(listItem).toHaveTextContent('Custom secondary text');
  });

  it('renders no secondary content when renderRecipe returns undefined for secondary', () => {
    const recipe = mockRecipe(
      'Test Recipe',
      [{ relation: 'adapted by', source: 'Adapter' }],
      'book',
    );

    render(
      <RecipeList
        recipes={[recipe]}
        renderRecipe={(r) => (
          <LinkListItem key={r.slug} href={getRecipeUrl(r)} primary={r.name} />
        )}
      />,
    );

    const listItem = screen.getByRole('listitem');
    expect(listItem).toHaveTextContent('Test Recipe');
    expect(listItem).not.toHaveTextContent('Adapter');
  });

  it('passes recipe to renderRecipe function', () => {
    const recipe1 = mockRecipe('Recipe A', [], 'book');
    const recipe2 = mockRecipe('Recipe B', [], 'book');
    const recipes = [recipe1, recipe2];

    render(
      <RecipeList
        recipes={recipes}
        renderRecipe={(r) => (
          <LinkListItem
            key={r.slug}
            href={getRecipeUrl(r)}
            primary={r.name}
            secondary={`Info: ${r.name}`}
          />
        )}
      />,
    );

    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent('Info: Recipe A');
    expect(listItems[1]).toHaveTextContent('Info: Recipe B');
  });
});
