import { waitFor } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { describe, expect, it } from 'vitest';
import { setupApp } from '#/vitest.setup';
import SearchPage from './page';

describe('SearchPage', () => {
  it('redirects to all recipes with the search term', async () => {
    mockRouter.setCurrentUrl('/search?search=mai%20tai');
    await setupApp(SearchPage());

    await waitFor(() => {
      expect(mockRouter).toMatchObject({
        pathname: '/list/recipes',
        query: { search: 'mai tai' },
      });
    });
  });

  it('redirects to all recipes without a search term', async () => {
    mockRouter.setCurrentUrl('/search');
    await setupApp(SearchPage());

    await waitFor(() => {
      expect(mockRouter).toMatchObject({ pathname: '/list/recipes', query: {} });
    });
  });
});
