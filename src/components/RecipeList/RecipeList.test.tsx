import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecipeList from './index';
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

describe('RecipeList attribution priority', () => {
  it('prioritizes "adapted by" over "recipe author" for book sources', () => {
    const recipe1 = mockRecipe(
      'Duplicate Recipe',
      [
        { relation: 'recipe author', source: 'Original Author' },
        { relation: 'adapted by', source: 'Adapter' },
      ],
      'book',
    );
    const recipe2 = mockRecipe('Duplicate Recipe', [], 'book');

    render(<RecipeList recipes={[recipe1, recipe2]} />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent('Duplicate Recipe');
    expect(listItems[0]).toHaveTextContent('Adapter | Test Source');
  });

  it('prioritizes "adapted by" over "bar" for book sources', () => {
    const recipe1 = mockRecipe(
      'Duplicate Recipe',
      [
        { relation: 'bar', source: 'Some Bar' },
        { relation: 'adapted by', source: 'Adapter' },
      ],
      'book',
    );
    const recipe2 = mockRecipe('Duplicate Recipe', [], 'book');

    render(<RecipeList recipes={[recipe1, recipe2]} />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent('Duplicate Recipe');
    expect(listItems[0]).toHaveTextContent('Adapter | Test Source');
  });

  it('prioritizes "recipe author" over "bar" for book sources', () => {
    const recipe1 = mockRecipe(
      'Duplicate Recipe',
      [
        { relation: 'bar', source: 'Some Bar' },
        { relation: 'recipe author', source: 'Author' },
      ],
      'book',
    );
    const recipe2 = mockRecipe('Duplicate Recipe', [], 'book');

    render(<RecipeList recipes={[recipe1, recipe2]} />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent('Duplicate Recipe');
    expect(listItems[0]).toHaveTextContent('Author | Test Source');
  });

  it('uses source name for bar attribution with book sources', () => {
    const recipe1 = mockRecipe(
      'Duplicate Recipe',
      [{ relation: 'bar', source: 'Some Bar' }],
      'book',
    );
    const recipe2 = mockRecipe('Duplicate Recipe', [], 'book');

    render(<RecipeList recipes={[recipe1, recipe2]} />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent('Duplicate Recipe');
    expect(listItems[0]).toHaveTextContent('Test Source');
    expect(listItems[1]).toHaveTextContent('Duplicate Recipe');
    expect(listItems[1]).toHaveTextContent('Test Source');
  });

  it('uses source name when no attributions exist', () => {
    const recipe1 = mockRecipe('Duplicate Recipe', [], 'book');
    const recipe2 = mockRecipe('Duplicate Recipe', [], 'book');

    render(<RecipeList recipes={[recipe1, recipe2]} />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent('Duplicate Recipe');
    expect(listItems[0]).toHaveTextContent('Test Source');
    expect(listItems[1]).toHaveTextContent('Duplicate Recipe');
    expect(listItems[1]).toHaveTextContent('Test Source');
  });

  it('handles non-book sources with adapted by attribution', () => {
    const recipe1 = mockRecipe(
      'Duplicate Recipe',
      [{ relation: 'adapted by', source: 'Adapter' }],
      'podcast',
    );
    const recipe2 = mockRecipe('Duplicate Recipe', [], 'podcast');

    render(<RecipeList recipes={[recipe1, recipe2]} />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent('Duplicate Recipe');
    expect(listItems[0]).toHaveTextContent('Adapter');
    expect(listItems[0]).not.toHaveTextContent('Test Source');
  });

  it('handles bar attribution with non-book sources', () => {
    const recipe1 = mockRecipe(
      'Duplicate Recipe',
      [{ relation: 'bar', source: 'Some Bar' }],
      'podcast',
    );
    const recipe2 = mockRecipe('Duplicate Recipe', [], 'podcast');

    render(<RecipeList recipes={[recipe1, recipe2]} />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent('Duplicate Recipe');
    expect(listItems[0]).toHaveTextContent('served at Some Bar');
  });

  it('shows no secondary text when recipe names are unique', () => {
    const recipe = mockRecipe(
      'Unique Recipe',
      [{ relation: 'adapted by', source: 'Adapter' }],
      'book',
    );

    render(<RecipeList recipes={[recipe]} />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent('Unique Recipe');
    expect(listItems[0]).not.toHaveTextContent('Adapter');
    expect(listItems[0]).not.toHaveTextContent('Test Source');
  });
});
