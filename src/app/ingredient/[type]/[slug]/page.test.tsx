import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { setupApp } from '@/testing';
import IngredientPage from './page';

describe('IngredientPage', () => {
  describe('recipe list quantity display', () => {
    it('displays ingredient quantity for each recipe', async () => {
      // Pineapple juice is used in 39+ recipes with various quantities
      setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: 'juice', slug: 'pineapple-juice' }),
        }),
      );

      // Get all listitems and find by text content
      const allListItems = screen.getAllByRole('listitem');

      // Jungle bird (Smuggler's Cove) uses 2 oz pineapple juice
      const jungleBird = allListItems.find(
        (item) =>
          item.textContent?.includes('Jungle bird') &&
          item.textContent?.includes("Smuggler's Cove"),
      );
      expect(jungleBird).toHaveTextContent('2oz');

      // Chartreuse swizzle uses 1 oz pineapple juice
      const chartreuse = allListItems.find((item) =>
        item.textContent?.includes('Chartreuse swizzle'),
      );
      expect(chartreuse).toHaveTextContent('1oz');
    });

    it('displays quantity with attribution for duplicate recipe names', async () => {
      // Pineapple juice has two "Jungle bird" recipes from different sources:
      // - "Jungle bird" from Smuggler's Cove (2 oz pineapple juice)
      // - "Jungle Bird" from Tiki Modern (1.5 oz pineapple juice, rendered as 1 ½oz)
      setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: 'juice', slug: 'pineapple-juice' }),
        }),
      );

      const allListItems = screen.getAllByRole('listitem');

      // Smuggler's Cove version: 2 oz, attributed to Smuggler's Cove book
      const smugglersCove = allListItems.find(
        (item) =>
          item.textContent?.includes('Jungle bird') &&
          item.textContent?.includes("Smuggler's Cove"),
      );
      expect(smugglersCove).toHaveTextContent('2oz');
      expect(smugglersCove).toHaveTextContent("Smuggler's Cove");

      // Tiki Modern version: 1.5 oz (rendered as fraction), attributed to book
      const tikiModern = allListItems.find(
        (item) =>
          item.textContent?.includes('Jungle Bird') &&
          item.textContent?.includes('Tiki: Modern Tropical Cocktails'),
      );
      expect(tikiModern).toHaveTextContent('1 ½oz');
      expect(tikiModern).toHaveTextContent('Tiki: Modern Tropical Cocktails');
    });

    it('does not show attribution for unique recipe names', async () => {
      setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: 'juice', slug: 'pineapple-juice' }),
        }),
      );

      const allListItems = screen.getAllByRole('listitem');

      // Chartreuse swizzle is unique (only one recipe with that name)
      const chartreuse = allListItems.find((item) =>
        item.textContent?.includes('Chartreuse swizzle'),
      );

      // Should show quantity but NOT source attribution
      expect(chartreuse).toHaveTextContent('1oz');
      expect(chartreuse).not.toHaveTextContent("Smuggler's Cove");
    });
  });
});
