import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { vi, afterEach } from 'vitest';
import { getAllCategories } from '@/modules/categories';
import { getAllRecipes } from '@/modules/recipes';

vi.mock('next/router', async () => import('next-router-mock'));
vi.mock('next/navigation', async () => import('next-router-mock/navigation'));

// Pre-load and memoize data to speed up tests
await getAllRecipes();
await getAllCategories();

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
