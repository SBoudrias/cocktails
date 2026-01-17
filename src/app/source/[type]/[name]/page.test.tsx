import { screen } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { setupApp } from '@/testing';
import SourcePage from './page';

// Using Anders Erickson YouTube channel as the main test source
const TEST_YOUTUBE = {
  type: 'youtube-channel' as const,
  slug: 'anders-erickson',
  name: 'Anders Erickson',
};

// Using a second YouTube channel for variety testing
const TEST_YOUTUBE_ALT = {
  type: 'youtube-channel' as const,
  slug: 'educated-barfly',
  name: 'The Educated Barfly',
};

describe('SourcePage', () => {
  describe('basic rendering', () => {
    it('renders SearchHeader with searchbox', async () => {
      setupApp(
        await SourcePage({
          params: Promise.resolve({ type: TEST_YOUTUBE.type, name: TEST_YOUTUBE.slug }),
        }),
      );

      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('renders source about card with source name', async () => {
      setupApp(
        await SourcePage({
          params: Promise.resolve({ type: TEST_YOUTUBE.type, name: TEST_YOUTUBE.slug }),
        }),
      );

      // Source name appears in the about card
      expect(screen.getByText(TEST_YOUTUBE.name)).toBeInTheDocument();
    });

    it('renders recipe list with header', async () => {
      setupApp(
        await SourcePage({
          params: Promise.resolve({ type: TEST_YOUTUBE.type, name: TEST_YOUTUBE.slug }),
        }),
      );

      expect(screen.getByText('All Recipes')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('search filters recipes within source', async () => {
      const { user } = setupApp(
        await SourcePage({
          params: Promise.resolve({ type: TEST_YOUTUBE.type, name: TEST_YOUTUBE.slug }),
        }),
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'margarita');

      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent(/margarita/i);
    });

    it('URL updates with search param', async () => {
      const onUrlUpdate = vi.fn();
      const { user } = setupApp(
        await SourcePage({
          params: Promise.resolve({ type: TEST_YOUTUBE.type, name: TEST_YOUTUBE.slug }),
        }),
        { nuqsOptions: { onUrlUpdate } },
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'margarita');

      expect(onUrlUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryString: '?search=margarita' }),
      );
    });

    it('shows SearchAllLink in no results state', async () => {
      const { user } = setupApp(
        await SourcePage({
          params: Promise.resolve({ type: TEST_YOUTUBE.type, name: TEST_YOUTUBE.slug }),
        }),
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'xyznonexistent');

      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /search all recipes/i }),
      ).toBeInTheDocument();
    });

    it('hides source about card when searching', async () => {
      const { user } = setupApp(
        await SourcePage({
          params: Promise.resolve({ type: TEST_YOUTUBE.type, name: TEST_YOUTUBE.slug }),
        }),
      );

      // About card is visible initially (shows source name)
      expect(screen.getByText(TEST_YOUTUBE.name)).toBeInTheDocument();

      const input = screen.getByRole('searchbox');
      await user.type(input, 'margarita');

      // About card should be hidden during search
      expect(screen.queryByText(TEST_YOUTUBE.name)).not.toBeInTheDocument();
    });

    it('back button navigates correctly', async () => {
      await mockRouter.push('/');
      await mockRouter.push(`/source/${TEST_YOUTUBE.type}/${TEST_YOUTUBE.slug}`);

      const backSpy = vi.spyOn(mockRouter, 'back');

      const { user } = setupApp(
        await SourcePage({
          params: Promise.resolve({ type: TEST_YOUTUBE.type, name: TEST_YOUTUBE.slug }),
        }),
      );

      const backButton = screen.getByRole('button', { name: /go back/i });
      await user.click(backButton);

      expect(backSpy).toHaveBeenCalled();
      backSpy.mockRestore();
    });

    it('loads with search term from URL', async () => {
      setupApp(
        await SourcePage({
          params: Promise.resolve({ type: TEST_YOUTUBE.type, name: TEST_YOUTUBE.slug }),
        }),
        { nuqsOptions: { searchParams: '?search=margarita' } },
      );

      const input = screen.getByRole('searchbox');
      expect(input).toHaveValue('margarita');

      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent(/margarita/i);
    });

    it('clearing search restores full page content', async () => {
      const { user } = setupApp(
        await SourcePage({
          params: Promise.resolve({ type: TEST_YOUTUBE.type, name: TEST_YOUTUBE.slug }),
        }),
        { nuqsOptions: { searchParams: '?search=margarita' } },
      );

      // Initially filtered - about card hidden
      expect(screen.queryByText(TEST_YOUTUBE.name)).not.toBeInTheDocument();

      // Clear the search
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      // About card should be restored
      expect(screen.getByText(TEST_YOUTUBE.name)).toBeInTheDocument();
      expect(screen.getByText('All Recipes')).toBeInTheDocument();
    });
  });

  describe('with alternate youtube-channel source', () => {
    it('renders different youtube channel source correctly', async () => {
      setupApp(
        await SourcePage({
          params: Promise.resolve({
            type: TEST_YOUTUBE_ALT.type,
            name: TEST_YOUTUBE_ALT.slug,
          }),
        }),
      );

      // Source name appears in the about card
      expect(screen.getByText(TEST_YOUTUBE_ALT.name)).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('search works with alternate youtube channel recipes', async () => {
      const { user } = setupApp(
        await SourcePage({
          params: Promise.resolve({
            type: TEST_YOUTUBE_ALT.type,
            name: TEST_YOUTUBE_ALT.slug,
          }),
        }),
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'daiquiri');

      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent(/daiquiri/i);
    });
  });
});

// Book source with chapters (Smuggler's Cove)
const TEST_BOOK_WITH_CHAPTERS = {
  type: 'book' as const,
  slug: 'smugglers-cove',
  name: "Smuggler's Cove",
};

// Book source without chapters
const TEST_BOOK_WITHOUT_CHAPTERS = {
  type: 'book' as const,
  slug: 'easy-tiki',
  name: 'Easy Tiki',
};

describe('SourcePage - Book sources', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('book with chapters', () => {
    it('renders grouping toggle for books with chapters', async () => {
      setupApp(
        await SourcePage({
          params: Promise.resolve({
            type: TEST_BOOK_WITH_CHAPTERS.type,
            name: TEST_BOOK_WITH_CHAPTERS.slug,
          }),
        }),
      );

      expect(screen.getByRole('group', { name: /recipe grouping/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /by chapter/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /a-z/i })).toBeInTheDocument();
    });

    it('defaults to chapter grouping view', async () => {
      setupApp(
        await SourcePage({
          params: Promise.resolve({
            type: TEST_BOOK_WITH_CHAPTERS.type,
            name: TEST_BOOK_WITH_CHAPTERS.slug,
          }),
        }),
      );

      // Check that chapter toggle shows chapter is selected
      expect(screen.getByRole('button', { name: /by chapter/i })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      // Chapter names should appear as group headers
      expect(screen.getByText('The Birth of Tiki')).toBeInTheDocument();
      expect(screen.getByText('The Golden Era')).toBeInTheDocument();
    });

    it('switches to alphabetical view when A-Z is clicked', async () => {
      const { user } = setupApp(
        await SourcePage({
          params: Promise.resolve({
            type: TEST_BOOK_WITH_CHAPTERS.type,
            name: TEST_BOOK_WITH_CHAPTERS.slug,
          }),
        }),
      );

      const azButton = screen.getByRole('button', { name: /a-z/i });
      await user.click(azButton);

      // Should now show alphabetical groups
      expect(azButton).toHaveAttribute('aria-pressed', 'true');
      // Alphabetical header should appear
      expect(screen.getByRole('group', { name: 'A' })).toBeInTheDocument();
    });

    it('persists grouping preference in localStorage', async () => {
      const { user } = setupApp(
        await SourcePage({
          params: Promise.resolve({
            type: TEST_BOOK_WITH_CHAPTERS.type,
            name: TEST_BOOK_WITH_CHAPTERS.slug,
          }),
        }),
      );

      // Switch to A-Z
      await user.click(screen.getByRole('button', { name: /a-z/i }));

      expect(localStorage.getItem('book-grouping')).toBe('"alphabetical"');
    });

    it('loads grouping preference from localStorage', async () => {
      localStorage.setItem('book-grouping', '"alphabetical"');

      setupApp(
        await SourcePage({
          params: Promise.resolve({
            type: TEST_BOOK_WITH_CHAPTERS.type,
            name: TEST_BOOK_WITH_CHAPTERS.slug,
          }),
        }),
      );

      expect(screen.getByRole('button', { name: /a-z/i })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    it('hides grouping toggle when searching', async () => {
      const { user } = setupApp(
        await SourcePage({
          params: Promise.resolve({
            type: TEST_BOOK_WITH_CHAPTERS.type,
            name: TEST_BOOK_WITH_CHAPTERS.slug,
          }),
        }),
      );

      // Toggle visible initially
      expect(screen.getByRole('group', { name: /recipe grouping/i })).toBeInTheDocument();

      const input = screen.getByRole('searchbox');
      await user.type(input, 'zombie');

      // Toggle should be hidden during search
      expect(
        screen.queryByRole('group', { name: /recipe grouping/i }),
      ).not.toBeInTheDocument();
    });

    it('shows recipes grouped by chapter with correct sorting', async () => {
      setupApp(
        await SourcePage({
          params: Promise.resolve({
            type: TEST_BOOK_WITH_CHAPTERS.type,
            name: TEST_BOOK_WITH_CHAPTERS.slug,
          }),
        }),
      );

      // Verify chapter headers appear in order
      const lists = screen.getAllByRole('list');
      const mainList = lists.find((list) =>
        list.textContent?.includes('The Birth of Tiki'),
      );
      expect(mainList).toBeDefined();

      // Verify recipes from the first chapter are present
      expect(
        screen.getByRole('link', { name: /three dots and a dash/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /pupule/i })).toBeInTheDocument();
    });
  });

  describe('book without chapters', () => {
    it('does not render grouping toggle for books without chapters', async () => {
      setupApp(
        await SourcePage({
          params: Promise.resolve({
            type: TEST_BOOK_WITHOUT_CHAPTERS.type,
            name: TEST_BOOK_WITHOUT_CHAPTERS.slug,
          }),
        }),
      );

      expect(
        screen.queryByRole('group', { name: /recipe grouping/i }),
      ).not.toBeInTheDocument();
    });

    it('shows recipes grouped alphabetically by default', async () => {
      setupApp(
        await SourcePage({
          params: Promise.resolve({
            type: TEST_BOOK_WITHOUT_CHAPTERS.type,
            name: TEST_BOOK_WITHOUT_CHAPTERS.slug,
          }),
        }),
      );

      // Should show alphabetical grouping
      expect(screen.getByRole('group', { name: 'A' })).toBeInTheDocument();
    });
  });
});
