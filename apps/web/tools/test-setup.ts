import '@testing-library/jest-dom/vitest';
import { getAllCategories, getAllIngredients, getAllRecipes } from '@cocktails/data';
import { vi } from 'vitest';

vi.mock('next/router', async () => import('next-router-mock'));
vi.mock('next/navigation', async () => import('next-router-mock/navigation'));

// Pre-load and memoize data to speed up tests
await getAllRecipes();
await getAllCategories();
await getAllIngredients();
