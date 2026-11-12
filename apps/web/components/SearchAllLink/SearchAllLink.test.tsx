import { render, screen } from '@testing-library/react';
import SearchAllLink from './index';

describe('SearchAllLink', () => {
  it('renders link with correct href including search term', () => {
    render(<SearchAllLink searchTerm="mai tai" />);

    const link = screen.getByRole('link', { name: /search all recipes/i });
    expect(link).toHaveAttribute('href', '/search?search=mai+tai');
  });

  it.each([
    { searchTerm: null, reason: 'null' },
    { searchTerm: '', reason: 'an empty string' },
    { searchTerm: '   ', reason: 'whitespace only' },
  ])('does not render when searchTerm is $reason', ({ searchTerm }) => {
    const { container } = render(<SearchAllLink searchTerm={searchTerm} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('displays helpful text for users', () => {
    render(<SearchAllLink searchTerm="test" />);

    expect(
      screen.getByRole('link', { name: /not finding what you're looking for/i }),
    ).toBeInTheDocument();
  });
});
