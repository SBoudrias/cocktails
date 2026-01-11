import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { vi, afterEach } from 'vitest';
import * as mockRouter from 'next-router-mock';

vi.mock('next/router', () => mockRouter);
vi.mock('next/navigation', () => ({
  ...mockRouter,
  usePathname: () => mockRouter.memoryRouter.asPath.split('?')[0],
}));

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
