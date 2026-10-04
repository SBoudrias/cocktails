import { screen } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { setupApp } from '#/vitest.setup';
import AppSidebar from './index';

const testCategory = {
  slug: 'gin',
  name: 'Gin',
  categoryType: 'spirit' as const,
};

const testSource = {
  slug: 'minimalist-tiki',
  name: 'Minimalist Tiki',
  type: 'book' as const,
};

function setupSidebar() {
  return setupApp(<AppSidebar categories={[testCategory]} sources={[testSource]} />, {
    routerOptions: { url: '/' },
  });
}

describe('AppSidebar', () => {
  it('renders browse links', () => {
    setupSidebar();

    expect(screen.getByRole('link', { name: 'All Recipes' })).toHaveAttribute(
      'href',
      '/list/recipes',
    );
    expect(screen.getByRole('link', { name: 'Recently Added' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'By Authors' })).toBeInTheDocument();
  });

  it('renders calculator links', () => {
    setupSidebar();

    expect(screen.getByRole('link', { name: 'Saline Solution' })).toHaveAttribute(
      'href',
      '/calculators/saline',
    );
  });

  it('shows collapsed groups with item counts', () => {
    setupSidebar();

    expect(screen.getByRole('button', { name: 'Spirits (1)' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Gin' })).not.toBeInTheDocument();
  });

  it('expands a category group to reveal its links', async () => {
    const { user } = setupSidebar();

    await user.click(screen.getByRole('button', { name: 'Spirits (1)' }));

    expect(screen.getByRole('link', { name: 'Gin' })).toHaveAttribute(
      'href',
      '/category/gin',
    );
  });

  it('expands a source group to reveal its links', async () => {
    const { user } = setupSidebar();

    expect(
      screen.queryByRole('link', { name: 'Minimalist Tiki' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Books (1)' }));

    expect(screen.getByRole('link', { name: 'Minimalist Tiki' })).toHaveAttribute(
      'href',
      '/source/book/minimalist-tiki',
    );
  });

  it('navigates to the recipe list with the search term on Enter', async () => {
    const { user } = setupSidebar();

    const input = screen.getByRole('searchbox');
    await user.type(input, 'daiquiri');
    await user.type(input, '{Enter}');

    expect(mockRouter.pathname).toBe('/list/recipes');
    expect(mockRouter.asPath).toContain('search=daiquiri');
  });
});
