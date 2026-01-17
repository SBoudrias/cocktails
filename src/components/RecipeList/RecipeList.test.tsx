import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { Recipe } from '@/types/Recipe';
import { getRecipeUrl } from '@/modules/url';
import { LinkListItem } from '../LinkList';
import RecipeList from './index';

let recipeCounter = 0;

const mockRecipe = (name: string): Recipe => ({
  name,
  slug: `recipe-${++recipeCounter}`,
  source: {
    type: 'book',
    name: 'Test Source',
    slug: 'test-source',
    link: 'https://example.com',
    description: 'Test description',
    recipeAmount: 1,
  },
  attributions: [],
  ingredients: [],
  preparation: 'shaken',
  served_on: 'up',
  glassware: 'coupe',
  refs: [],
});

describe('RecipeList rendering', () => {
  it('renders recipe names with default renderRecipe', () => {
    const recipe = mockRecipe('Unique Recipe');

    render(<RecipeList recipes={[recipe]} />);

    const listItem = screen.getByRole('listitem');
    expect(listItem).toHaveTextContent('Unique Recipe');
  });

  it('renders custom content when renderRecipe is provided', () => {
    const recipe = mockRecipe('Test Recipe');

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
    const recipe = mockRecipe('Test Recipe');

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
  });

  it('passes recipe to renderRecipe function', () => {
    const recipe1 = mockRecipe('Recipe A');
    const recipe2 = mockRecipe('Recipe B');
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
