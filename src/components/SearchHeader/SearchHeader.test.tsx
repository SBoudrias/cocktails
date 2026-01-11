import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchHeader from './index';

// Mock next/navigation
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack }),
  usePathname: () => '/list/recipes',
}));

describe('SearchHeader', () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  it('renders title when search is not active', () => {
    render(
      <SearchHeader title="All Recipes" searchTerm={null} onSearchChange={vi.fn()} />,
    );

    expect(screen.getByText('All Recipes')).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('shows search input when search icon clicked', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();

    render(
      <SearchHeader
        title="All Recipes"
        searchTerm={null}
        onSearchChange={onSearchChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  it('shows search input when searchTerm is provided', () => {
    render(
      <SearchHeader title="All Recipes" searchTerm="mojito" onSearchChange={vi.fn()} />,
    );

    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('mojito');
    expect(screen.queryByText('All Recipes')).not.toBeInTheDocument();
  });

  it('calls onSearchChange when typing in search input', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();

    render(
      <SearchHeader title="All Recipes" searchTerm="" onSearchChange={onSearchChange} />,
    );

    const input = screen.getByRole('searchbox');
    await user.type(input, 'dai');

    expect(onSearchChange).toHaveBeenCalledTimes('dai'.length);
  });

  it('back button is always visible and clickable', async () => {
    const user = userEvent.setup();

    render(
      <SearchHeader title="All Recipes" searchTerm={null} onSearchChange={vi.fn()} />,
    );

    const backButton = screen.getByRole('button', { name: /go back/i });
    expect(backButton).toBeInTheDocument();

    await user.click(backButton);
    expect(mockBack).toHaveBeenCalled();
  });

  it('close button clears search and returns to title view', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();

    render(
      <SearchHeader
        title="All Recipes"
        searchTerm="mojito"
        onSearchChange={onSearchChange}
      />,
    );

    const closeButton = screen.getByRole('button', { name: /close search/i });
    await user.click(closeButton);

    expect(onSearchChange).toHaveBeenCalledWith(null);
  });

  it('search toggle button has correct aria-label', () => {
    render(
      <SearchHeader title="All Recipes" searchTerm={null} onSearchChange={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });
});
