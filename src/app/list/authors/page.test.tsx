import { screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { vi, describe, it, expect } from 'vitest';
import { getAuthorRecipesUrl } from '@/modules/url';
import { setupApp } from '@/testing';
import AuthorListPage from './page';

// Real author from the codebase with multiple recipes
const TEST_AUTHOR = 'Garret Richard';

describe('AuthorListPage', () => {
  it('shows search input, title and list', async () => {
    setupApp(await AuthorListPage());

    expect(screen.getByText('All Authors')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('typing filters author list', async () => {
    const { user } = setupApp(await AuthorListPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'garret');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(TEST_AUTHOR);
  });

  it('clearing search shows all authors grouped by letter', async () => {
    const { user } = setupApp(await AuthorListPage(), {
      nuqsOptions: { searchParams: { search: 'garret' } },
    });

    const input = screen.getByRole('searchbox');
    await user.clear(input);

    const groups = screen.getAllByRole('group');
    expect(groups.length).toBeGreaterThan(0);
  });

  it('URL updates with search param when typing', async () => {
    const onUrlUpdate = vi.fn();
    const { user } = setupApp(await AuthorListPage(), {
      nuqsOptions: { onUrlUpdate },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'john');

    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: '?search=john' }),
    );
  });

  it('shows no results when search has no matches', async () => {
    const { user } = setupApp(await AuthorListPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('does not show SearchAllLink when no results (not searching recipes)', async () => {
    const { user } = setupApp(await AuthorListPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /search all recipes/i }),
    ).not.toBeInTheDocument();
  });

  it('author items link to correct author recipes pages', async () => {
    setupApp(await AuthorListPage());

    const link = screen.getByRole('link', { name: new RegExp(TEST_AUTHOR, 'i') });
    expect(link).toHaveAttribute('href', getAuthorRecipesUrl(TEST_AUTHOR));
  });

  it('loads with search term from URL', async () => {
    setupApp(await AuthorListPage(), {
      nuqsOptions: { searchParams: { search: 'garret' } },
    });

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('garret');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(TEST_AUTHOR);
  });

  it('groups authors by first letter when not searching', async () => {
    setupApp(await AuthorListPage());

    const groups = screen.getAllByRole('group');
    expect(groups.length).toBeGreaterThan(0);

    const firstGroup = groups[0]!;
    const items = within(firstGroup).getAllByRole('listitem');
    expect(items.length).toBeGreaterThan(0);
  });

  it('back button navigates correctly', async () => {
    await mockRouter.push('/');
    await mockRouter.push('/list/authors');

    const backSpy = vi.spyOn(mockRouter, 'back');

    const { user } = setupApp(await AuthorListPage());

    const backButton = screen.getByRole('button', { name: /go back/i });
    await user.click(backButton);

    expect(backSpy).toHaveBeenCalled();
    backSpy.mockRestore();
  });

  it('shows recipe count for each author', async () => {
    setupApp(await AuthorListPage());

    const link = screen.getByRole('link', { name: new RegExp(TEST_AUTHOR, 'i') });
    expect(link).toHaveTextContent(/\d+/);
  });
});
