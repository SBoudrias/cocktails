import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { setupApp } from '@/testing';
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
  });

  describe('recipe list', () => {
    it('renders recipes using the category', async () => {
      setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      expect(screen.getByText(/Recipes using.*London Dry Gin/)).toBeInTheDocument();

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
});
