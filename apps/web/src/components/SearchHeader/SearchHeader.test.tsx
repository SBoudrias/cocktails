import { screen } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { setupApp } from '@/testing';
import SearchHeader from './index';

describe('SearchHeader', () => {
  it('renders title and search input together', () => {
    setupApp(
      <SearchHeader title="All Recipes" searchTerm={null} onSearchChange={vi.fn()} />,
    );

    expect(screen.getByRole('heading', { name: 'All Recipes' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('shows searchTerm value in search input', () => {
    setupApp(
      <SearchHeader title="All Recipes" searchTerm="mojito" onSearchChange={vi.fn()} />,
    );

    expect(screen.getByRole('searchbox')).toHaveValue('mojito');
  });

  it('hides title when search is active', () => {
    setupApp(
      <SearchHeader title="All Recipes" searchTerm="mojito" onSearchChange={vi.fn()} />,
    );

    expect(
      screen.queryByRole('heading', { name: 'All Recipes' }),
    ).not.toBeInTheDocument();
  });

  it('shows title when search is cleared', () => {
    setupApp(
      <SearchHeader title="All Recipes" searchTerm={null} onSearchChange={vi.fn()} />,
    );

    expect(screen.getByRole('heading', { name: 'All Recipes' })).toBeInTheDocument();
  });

  it('calls onSearchChange when typing in search input', async () => {
    const onSearchChange = vi.fn();

    const { user } = setupApp(
      <SearchHeader title="All Recipes" searchTerm="" onSearchChange={onSearchChange} />,
    );

    const input = screen.getByRole('searchbox');
    await user.type(input, 'dai');

    expect(onSearchChange).toHaveBeenCalledTimes('dai'.length);
  });

  it('home button is visible on pages and links to home', async () => {
    mockRouter.setCurrentUrl('/list/recipes');

    setupApp(
      <SearchHeader title="All Recipes" searchTerm={null} onSearchChange={vi.fn()} />,
    );

    const homeButton = screen.getByRole('link', { name: /go to home/i });
    expect(homeButton).toBeInTheDocument();
    expect(homeButton).toHaveAttribute('href', '/');
  });

  it("home button isn't available on home page", async () => {
    mockRouter.setCurrentUrl('/');
    setupApp(
      <SearchHeader title="All Recipes" searchTerm={null} onSearchChange={vi.fn()} />,
    );

    const homeButton = screen.queryByRole('link', { name: /go to home/i });
    expect(homeButton).not.toBeInTheDocument();
  });
});
