import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { getAllCategories } from '@/modules/categories';
import { getAllIngredients } from '@/modules/ingredients';
import { getAllRecipes } from '@/modules/recipes';

vi.mock('next/router', async () => import('next-router-mock'));
vi.mock('next/navigation', async () => import('next-router-mock/navigation'));

// Pre-load and memoize data to speed up tests
await getAllRecipes();
await getAllCategories();
await getAllIngredients();
