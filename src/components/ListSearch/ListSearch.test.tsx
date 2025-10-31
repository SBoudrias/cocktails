import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ListSearch from './index';

describe('ListSearch', () => {
  const defaultProps = {
    searchTerm: '',
    onSearchChange: vi.fn(),
    resultsCount: 10,
    totalCount: 20,
    isSearching: false,
  };

  it('renders the search input with placeholder', () => {
    render(<ListSearch {...defaultProps} placeholder="Search items..." />);

    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', 'Search items...');
  });

  it('displays the correct count when not searching', () => {
    render(<ListSearch {...defaultProps} />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('20 items');
  });

  it('displays the results count when searching', () => {
    render(<ListSearch {...defaultProps} isSearching={true} />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('10 results');
  });

  it('calls onSearchChange when user types', async () => {
    const onSearchChange = vi.fn();
    const user = userEvent.setup();

    // Create a controlled component
    const TestComponent = () => {
      const [value, setValue] = React.useState('');
      return (
        <ListSearch
          {...defaultProps}
          searchTerm={value}
          onSearchChange={(val) => {
            setValue(val || '');
            onSearchChange(val);
          }}
        />
      );
    };

    render(<TestComponent />);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'test');

    // Check that onSearchChange was called for each character
    expect(onSearchChange).toHaveBeenCalled();
    expect(onSearchChange).toHaveBeenCalledWith('test');
  });

  it('shows clear button when search term exists', () => {
    render(<ListSearch {...defaultProps} searchTerm="test" />);

    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toBeInTheDocument();
  });

  it('clears search when clear button is clicked', () => {
    const onSearchChange = vi.fn();
    render(
      <ListSearch {...defaultProps} searchTerm="test" onSearchChange={onSearchChange} />,
    );

    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);

    expect(onSearchChange).toHaveBeenCalledWith(null);
  });

  it('has proper ARIA labels for accessibility', () => {
    render(<ListSearch {...defaultProps} />);

    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveAttribute('aria-label', 'Search items');
    expect(searchInput).toHaveAttribute('aria-describedby', 'search-results-count');

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
  });

  it('blurs input on Enter key press', () => {
    render(<ListSearch {...defaultProps} />);

    const searchInput = screen.getByRole('searchbox') as HTMLInputElement;
    searchInput.focus();
    expect(document.activeElement).toBe(searchInput);

    fireEvent.keyUp(searchInput, { key: 'Enter' });
    expect(document.activeElement).not.toBe(searchInput);
  });

  it('focuses input when autoFocus is true', () => {
    render(<ListSearch {...defaultProps} autoFocus={true} />);

    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveFocus();
  });

  it('applies sticky positioning when sticky is true', () => {
    const { container } = render(<ListSearch {...defaultProps} sticky={true} />);

    const appBar = container.querySelector('header');
    expect(appBar).toHaveStyle({ position: 'sticky' });
  });

  it('applies static positioning when sticky is false', () => {
    const { container } = render(<ListSearch {...defaultProps} sticky={false} />);

    const appBar = container.querySelector('header');
    expect(appBar).toHaveStyle({ position: 'static' });
  });

  it('displays keyboard shortcut hint on desktop', () => {
    render(<ListSearch {...defaultProps} />);

    expect(screen.getByText('⌘K to search')).toBeInTheDocument();
  });
});
