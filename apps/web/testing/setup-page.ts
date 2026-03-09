import '@testing-library/jest-dom/vitest';
import { getAllCategories } from '@cocktails/data/categories';
import { getAllIngredients } from '@cocktails/data/ingredients';
import { getAllRecipes } from '@cocktails/data/recipes';
import { Storage } from 'happy-dom';
import { vi } from 'vitest';

vi.mock('next/router', async () => import('next-router-mock'));
vi.mock('next/navigation', async () => import('next-router-mock/navigation'));

// In Node.js 25+, the global localStorage is a built-in that lacks the full
// Web Storage API (e.g. no clear()). Replace it with happy-dom's implementation.
if (typeof localStorage?.clear !== 'function') {
  vi.stubGlobal('localStorage', new Storage());
}

// Pre-load and memoize data to speed up tests
await getAllRecipes();
await getAllCategories();
await getAllIngredients();
