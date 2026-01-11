import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { vi, afterEach } from 'vitest';

vi.mock('next/router', async () => import('next-router-mock'));
vi.mock('next/navigation', async () => import('next-router-mock/navigation'));

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
