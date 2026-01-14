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

  it('back button is visible on pages and clickable', async () => {
    mockRouter.setCurrentUrl('/list/recipes');

    const { user } = setupApp(
      <SearchHeader title="All Recipes" searchTerm={null} onSearchChange={vi.fn()} />,
    );

    const backButton = screen.getByRole('button', { name: /go back/i });
    expect(backButton).toBeInTheDocument();

    await user.click(backButton);
    // next-router-mock doesn't yet support `back()`, so cannot verify the behavior.
  });

  it('back button isnt avaible on home page', async () => {
    mockRouter.setCurrentUrl('/');
    setupApp(
      <SearchHeader title="All Recipes" searchTerm={null} onSearchChange={vi.fn()} />,
    );

    const backButton = screen.queryByRole('button', { name: /go back/i });
    expect(backButton).not.toBeInTheDocument();
  });
});
