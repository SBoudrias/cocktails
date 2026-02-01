import { screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { setupApp } from '#/testing';
import CategoryPage from './page';

describe('CategoryPage', () => {
  describe('basic rendering', () => {
    it('renders parent category information', async () => {
      setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      // London Dry Gin is a subset of Dry Gin
      expect(screen.getByText(/is a subset of/)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^Dry Gin/ })).toHaveAttribute(
        'href',
        '/category/dry-gin',
      );
    });

    it('renders example ingredients for the category', async () => {
      setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      // Should show examples of London Dry Gin
      expect(screen.getByText(/Examples of.*London Dry Gin/)).toBeInTheDocument();

      // Beefeater is a London Dry Gin
      expect(
        screen.getByRole('link', { name: 'Beefeater London Dry Gin' }),
      ).toBeInTheDocument();
    });

    it('renders search header with title', async () => {
      setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      expect(
        screen.getByRole('heading', { level: 1, name: 'London Dry Gin' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });
  });

  describe('recipe list', () => {
    it('renders recipes using the category with header', async () => {
      setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      // Recipes section has a header
      expect(screen.getByText('Recipes using London Dry Gin')).toBeInTheDocument();

      // Fog Cutter uses London Dry Gin as a category ingredient
      expect(screen.getByRole('link', { name: /Fog Cutter/ })).toBeInTheDocument();

      // Cloister uses Beefeater London Dry Gin (a specific bottle in the category)
      expect(screen.getByRole('link', { name: /Cloister/ })).toBeInTheDocument();
    });
  });

  describe('recipe list quantity display', () => {
    it('displays ingredient quantity for each recipe', async () => {
      setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      // Fog Cutter uses 0.5 oz London Dry Gin (category type)
      const fogCutterLink = screen.getByRole('link', { name: /Fog Cutter/ });
      expect(fogCutterLink).toHaveTextContent('½oz');

      // Cloister uses 1.5 oz Beefeater London Dry Gin (spirit in category)
      const cloisterLink = screen.getByRole('link', { name: /Cloister/ });
      expect(cloisterLink).toHaveTextContent('1 ½oz');
    });

    it('does not show attribution for unique recipe names', async () => {
      setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      // Cloister is unique (only one recipe with that name)
      const cloisterLink = screen.getByRole('link', { name: /Cloister/ });
      expect(cloisterLink).toHaveTextContent('1 ½oz');
      expect(cloisterLink).not.toHaveTextContent('Anders Erickson');
    });
  });

  describe('search functionality', () => {
    it('search filters recipes within category', async () => {
      const { user } = setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'fog');

      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent('Fog Cutter');
      expect(resultList).not.toHaveTextContent('Cloister');
    });

    it('URL updates with search param', async () => {
      const onUrlUpdate = vi.fn();
      const { user } = setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
        { nuqsOptions: { onUrlUpdate } },
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'fog');

      expect(onUrlUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryString: '?search=fog' }),
      );
    });

    it('shows SearchAllLink in no results state', async () => {
      const { user } = setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'xyznonexistent');

      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /search all recipes/i }),
      ).toBeInTheDocument();
    });

    it('hides category description when searching', async () => {
      const { user } = setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      // Parent categories should be visible initially
      expect(screen.getByText(/is a subset of/)).toBeInTheDocument();

      const input = screen.getByRole('searchbox');
      await user.type(input, 'fog');

      // Parent categories should be hidden during search
      expect(screen.queryByText(/is a subset of/)).not.toBeInTheDocument();
    });

    it('hides ingredient members list when searching', async () => {
      const { user } = setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      // Members list is visible initially
      expect(screen.getByText(/Examples of.*London Dry Gin/)).toBeInTheDocument();

      const input = screen.getByRole('searchbox');
      await user.type(input, 'fog');

      // Members list should be hidden during search
      expect(screen.queryByText(/Examples of.*London Dry Gin/)).not.toBeInTheDocument();
    });

    it('loads with search term from URL', async () => {
      setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
        { nuqsOptions: { searchParams: '?search=fog' } },
      );

      const input = screen.getByRole('searchbox');
      expect(input).toHaveValue('fog');

      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent('Fog Cutter');
      expect(resultList).not.toHaveTextContent('Cloister');
    });

    it('clearing search shows all content', async () => {
      const { user } = setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
        { nuqsOptions: { searchParams: '?search=fog' } },
      );

      // Initially filtered - examples should be hidden
      expect(screen.queryByText(/Examples of.*London Dry Gin/)).not.toBeInTheDocument();

      // Clear the search
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      // All content should be visible again
      expect(screen.getByText(/is a subset of/)).toBeInTheDocument();
      expect(screen.getByText(/Examples of.*London Dry Gin/)).toBeInTheDocument();

      // Recipes should be grouped alphabetically
      expect(screen.getByRole('link', { name: /Fog Cutter/ })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Cloister/ })).toBeInTheDocument();
    });
  });
});
