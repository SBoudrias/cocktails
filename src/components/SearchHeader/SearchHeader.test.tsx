import { screen } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import SearchHeader from './index';
import { setupApp } from '@/testing';

describe('SearchHeader', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/list/recipes');
  });

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

  it('back button is always visible and clickable', async () => {
    const { user } = setupApp(
      <SearchHeader title="All Recipes" searchTerm={null} onSearchChange={vi.fn()} />,
    );

    const backButton = screen.getByRole('button', { name: /go back/i });
    expect(backButton).toBeInTheDocument();

    await user.click(backButton);
    // next-router-mock tracks navigation via pathname changes
    // back() in mocked router navigates to previous URL
  });
});
