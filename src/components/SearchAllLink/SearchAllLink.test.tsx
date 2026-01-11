import { render, screen } from '@testing-library/react';
import SearchAllLink from './index';

describe('SearchAllLink', () => {
  it('renders link with correct href including search term', () => {
    render(<SearchAllLink searchTerm="mai tai" />);

    const link = screen.getByRole('link', { name: /search all recipes/i });
    expect(link).toHaveAttribute('href', '/search?search=mai+tai');
  });

  it('does not render when searchTerm is null', () => {
    const { container } = render(<SearchAllLink searchTerm={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render when searchTerm is empty string', () => {
    const { container } = render(<SearchAllLink searchTerm="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render when searchTerm is whitespace only', () => {
    const { container } = render(<SearchAllLink searchTerm="   " />);
    expect(container).toBeEmptyDOMElement();
  });

  it('displays helpful text for users', () => {
    render(<SearchAllLink searchTerm="test" />);

    expect(
      screen.getByRole('link', { name: /not finding what you're looking for/i }),
    ).toBeInTheDocument();
  });
});
