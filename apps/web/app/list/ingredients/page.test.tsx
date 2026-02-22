import { getAllCategories } from '@cocktails/data/categories';
import { getAllIngredients } from '@cocktails/data/ingredients';
import { screen, within } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { getCategoryUrl } from '#/modules/url';
import { setupApp } from '#/testing';
import IngredientsPage from './page';

describe('IngredientsPage', () => {
  it('shows search input, title and list', async () => {
    setupApp(await IngredientsPage());

    // Both title and search input are always visible
    expect(screen.getByText('All Ingredients')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();

    // Verify some real ingredients are shown grouped by letter
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('typing filters ingredient list', async () => {
    const { user } = setupApp(await IngredientsPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'lime juice');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(/lime juice/i);
  });

  it('clearing search shows all ingredients grouped by letter', async () => {
    const { user } = setupApp(await IngredientsPage(), {
      nuqsOptions: { searchParams: { search: 'lime' } },
    });

    // Initially filtered
    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(/lime juice/i);

    // Clear the search input
    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('lime');
    await user.clear(input);

    // All ingredients should be visible, grouped by letter
    // Verify groups exist (real data has many letters)
    expect(screen.getByRole('group', { name: 'A' })).toBeInTheDocument();
  });

  it('URL updates with search param when typing', async () => {
    const onUrlUpdate = vi.fn();
    const { user } = setupApp(await IngredientsPage(), {
      nuqsOptions: { onUrlUpdate },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'gin');

    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: '?search=gin' }),
    );
  });

  it('shows no results when search has no matches', async () => {
    const { user } = setupApp(await IngredientsPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
    // SearchAllLink component is shown in empty state
    expect(screen.getByRole('link', { name: /search all recipes/i })).toBeInTheDocument();
  });

  it('ingredient items link to correct ingredient detail pages', async () => {
    setupApp(await IngredientsPage());

    // Use a hardcoded known ingredient with getByText to avoid expensive
    // accessible name computation over the full ingredient list
    const link = screen.getByText('Apple juice').closest('a');
    expect(link).toHaveAttribute('href', '/ingredient/juice/apple-juice');
  });

  it('category items link to correct category pages', async () => {
    setupApp(await IngredientsPage());

    // Use a hardcoded known category with getByText to avoid expensive
    // accessible name computation over the full ingredient list
    const link = screen.getByText('Aged Rum').closest('a');
    expect(link).toHaveAttribute('href', getCategoryUrl({ slug: 'aged-rum' }));
  });

  it('loads with search term from URL', async () => {
    setupApp(await IngredientsPage(), {
      nuqsOptions: { searchParams: { search: 'lime' } },
    });

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('lime');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Lime');
  });

  it('groups ingredients by first letter when not searching', async () => {
    setupApp(await IngredientsPage());

    // Real data has ingredients starting with various letters
    // Just verify that letter groups exist
    const groups = screen.getAllByRole('group');
    expect(groups.length).toBeGreaterThan(0);

    // Each group should have items (subheader + ingredient links)
    const firstGroup = groups[0]!;
    const items = within(firstGroup).getAllByRole('listitem');
    expect(items.length).toBeGreaterThan(0);
  });

  it('filters out liqueur and spirit type ingredients', async () => {
    setupApp(await IngredientsPage());

    // Get all displayed ingredient names
    const allIngredients = await getAllIngredients();
    const liqueurOrSpirit = allIngredients.filter(
      (i) => i.type === 'liqueur' || i.type === 'spirit',
    );

    const list = screen.getByRole('list');

    // Verify liqueur/spirit ingredients are NOT shown
    for (const ingredient of liqueurOrSpirit.slice(0, 3)) {
      expect(list).not.toHaveTextContent(ingredient.name);
    }
  });

  it('combines ingredients and categories in the list', async () => {
    setupApp(await IngredientsPage());

    // Get real data
    const allIngredients = await getAllIngredients();
    const allCategories = await getAllCategories();

    const filteredIngredients = allIngredients.filter(
      (i) => i.type !== 'liqueur' && i.type !== 'spirit',
    );

    const list = screen.getByRole('list');

    // Verify at least one ingredient and one category are shown
    const sampleIngredient = filteredIngredients[0]!;
    const sampleCategory = allCategories[0]!;

    expect(list).toHaveTextContent(sampleIngredient.name);
    expect(list).toHaveTextContent(sampleCategory.name);
  });
});
