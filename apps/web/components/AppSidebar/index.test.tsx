import { act, screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { setupApp } from '#/vitest.setup';
import AppSidebar from './index';

const testCategory = {
  slug: 'gin',
  name: 'Gin',
  categoryType: 'spirit' as const,
  parents: [],
};

const testSource = {
  slug: 'minimalist-tiki',
  name: 'Minimalist Tiki',
  type: 'book' as const,
};

function setupSidebar({ url = '/' }: { url?: string } = {}) {
  // The router mock is a singleton: reset it explicitly so each test renders
  // against its own URL (direct URLs must be active at first render).
  mockRouter.setCurrentUrl(url);
  return setupApp(<AppSidebar categories={[testCategory]} sources={[testSource]} />);
}

describe('AppSidebar', () => {
  it('keeps browse links and concise sections visible on home', () => {
    setupSidebar();
    expect(screen.getByRole('link', { name: 'All Recipes' })).toHaveAttribute(
      'href',
      '/list/recipes',
    );
    expect(screen.getByRole('link', { name: 'Recently Added' })).toBeInTheDocument();
    for (const name of ['Calculators', 'Categories', 'Sources', 'Lists']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    }
    expect(screen.queryByRole('link', { name: 'Gin' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'By Authors' })).not.toBeInTheDocument();
  });

  it('reveals calculator links with the same names as home', async () => {
    const { user } = setupSidebar();
    await user.click(screen.getByRole('button', { name: 'Calculators' }));
    expect(
      screen.getByRole('link', { name: 'Saline Solution Calculator' }),
    ).toHaveAttribute('href', '/calculators/saline');
  });

  it('keeps stable controlled panels when collapsed', () => {
    setupSidebar();
    const disclosure = screen.getByRole('button', { name: 'Categories' });
    expect(disclosure).toHaveAttribute('aria-controls', 'sidebar-group-categories');
    expect(document.getElementById('sidebar-group-categories')).toBeInTheDocument();
  });

  it('expands category sections with keyboard-accessible state', async () => {
    const { user } = setupSidebar();
    await user.click(screen.getByRole('button', { name: 'Categories' }));
    const spirits = screen.getByRole('button', { name: 'Spirits (1)' });
    expect(spirits).toHaveAttribute('aria-expanded', 'false');
    expect(spirits).toHaveAttribute('aria-controls', 'sidebar-group-Spirits');
    await user.tab();
    expect(spirits).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(spirits).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Gin' })).toHaveAttribute(
      'href',
      '/category/gin',
    );
    await user.keyboard(' ');
    expect(spirits).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands source sections to reveal their links', async () => {
    const { user } = setupSidebar();
    await user.click(screen.getByRole('button', { name: 'Sources' }));
    await user.click(screen.getByRole('button', { name: 'Books (1)' }));
    expect(screen.getByRole('link', { name: 'Minimalist Tiki' })).toHaveAttribute(
      'href',
      '/source/book/minimalist-tiki',
    );
  });

  it('opens both category ancestors and marks the current direct URL', () => {
    setupSidebar({ url: '/category/gin' });
    expect(screen.getByRole('link', { name: 'Gin' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    for (const name of ['Categories', 'Spirits (1)']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    }
    expect(screen.getByRole('link', { name: 'All Recipes' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('opens both source ancestors on a direct URL', () => {
    setupSidebar({ url: '/source/book/minimalist-tiki' });
    expect(screen.getByRole('link', { name: 'Minimalist Tiki' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    for (const name of ['Sources', 'Books (1)']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    }
  });

  it('reveals an active subtype without expanding the catalogue', () => {
    mockRouter.setCurrentUrl('/category/london-dry-gin');
    setupApp(
      <AppSidebar
        categories={[
          testCategory,
          {
            ...testCategory,
            name: 'London dry gin',
            slug: 'london-dry-gin',
            parents: ['gin'],
          },
        ]}
        sources={[testSource]}
      />,
    );
    expect(screen.getByRole('link', { name: 'London dry gin' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Gin' })).toBeInTheDocument();
  });

  it('opens the active branch after client navigation', async () => {
    setupSidebar();
    await act(() => mockRouter.push('/category/gin'));
    expect(screen.getByRole('button', { name: 'Categories' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('link', { name: 'Gin' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('submits a trimmed global search on Enter', async () => {
    const { user } = setupSidebar();
    const input = screen.getByRole('searchbox', { name: 'Search all recipes' });
    await user.type(input, '  mai tai  {Enter}');
    expect(mockRouter.pathname).toBe('/list/recipes');
    expect(mockRouter.query).toEqual({ search: 'mai tai' });
    expect(
      screen.queryByRole('searchbox', { name: 'Search all recipes' }),
    ).not.toBeInTheDocument();
  });

  it('submits with the visible arrow button without changing route while drafting', async () => {
    const { user } = setupSidebar({ url: '/category/gin?search=dai' });
    await user.type(
      screen.getByRole('searchbox', { name: 'Search all recipes' }),
      'mai tai',
    );
    expect(mockRouter.asPath).toBe('/category/gin?search=dai');
    await user.click(screen.getByRole('button', { name: 'Submit global search' }));
    expect(mockRouter.query).toEqual({ search: 'mai tai' });
  });

  it('does not duplicate the all-recipes search or Clear button', () => {
    setupSidebar({ url: '/list/recipes?search=dai' });
    const nav = screen.getByRole('navigation', { name: 'Site sections' });
    expect(within(nav).queryByRole('searchbox')).not.toBeInTheDocument();
    expect(within(nav).queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All Recipes' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
