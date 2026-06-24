import { redirect } from 'next/navigation';
import SearchPage from './page';

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

describe('SearchPage', () => {
  it('redirects the search term to the recipe list', async () => {
    await SearchPage({
      searchParams: Promise.resolve({ search: 'mai tai' }),
    });

    expect(redirect).toHaveBeenLastCalledWith('/list/recipes?search=mai%20tai');
  });

  it('redirects to the unfiltered recipe list without a search term', async () => {
    await SearchPage({ searchParams: Promise.resolve({}) });

    expect(redirect).toHaveBeenLastCalledWith('/list/recipes');
  });
});
