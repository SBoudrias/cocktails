import { screen } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { vi, describe, it, expect } from 'vitest';
import { setupApp } from '@/testing';
import SourcePage from './page';

// Using real Smuggler's Cove book which has:
// - 100+ recipes
// - Description text
// - Well-known recipes like Mai Tai, Jungle Bird, etc.
const TEST_BOOK = {
  type: 'book' as const,
  slug: 'smugglers-cove',
  name: "Smuggler's Cove",
};

// Using Anders Erickson YouTube channel for source type variety
const TEST_YOUTUBE = {
  type: 'youtube-channel' as const,
  slug: 'anders-erickson',
  name: 'Anders Erickson',
};

describe('SourcePage', () => {
  describe('basic rendering', () => {
    it('renders SearchHeader with searchbox', async () => {
      setupApp(
        await SourcePage({
          params: Promise.resolve({ type: TEST_BOOK.type, name: TEST_BOOK.slug }),
        }),
      );

      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('renders source about card with description', async () => {
      setupApp(
        await SourcePage({
          params: Promise.resolve({ type: TEST_BOOK.type, name: TEST_BOOK.slug }),
        }),
      );

      // Smuggler's Cove has a description mentioning Martin and Rebecca Cate
      expect(screen.getByText(/Martin and Rebecca Cate/)).toBeInTheDocument();
    });

    it('renders recipe list with header', async () => {
      setupApp(
        await SourcePage({
          params: Promise.resolve({ type: TEST_BOOK.type, name: TEST_BOOK.slug }),
        }),
      );

      expect(screen.getByText('All Recipes')).toBeInTheDocument();

      // Mai Tai is a well-known Smuggler's Cove recipe
      expect(screen.getByRole('link', { name: /Mai Tai/ })).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('search filters recipes within source', async () => {
      const { user } = setupApp(
        await SourcePage({
          params: Promise.resolve({ type: TEST_BOOK.type, name: TEST_BOOK.slug }),
        }),
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'jungle bird');

      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent('Jungle bird');
      expect(resultList).not.toHaveTextContent('Mai Tai');
    });

    it('URL updates with search param', async () => {
      const onUrlUpdate = vi.fn();
      const { user } = setupApp(
        await SourcePage({
          params: Promise.resolve({ type: TEST_BOOK.type, name: TEST_BOOK.slug }),
        }),
        { nuqsOptions: { onUrlUpdate } },
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'mai tai');

      expect(onUrlUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryString: '?search=mai+tai' }),
      );
    });

    it('shows SearchAllLink in no results state', async () => {
      const { user } = setupApp(
        await SourcePage({
          params: Promise.resolve({ type: TEST_BOOK.type, name: TEST_BOOK.slug }),
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
          params: Promise.resolve({ type: TEST_BOOK.type, name: TEST_BOOK.slug }),
        }),
      );

      // About card is visible initially
      expect(screen.getByText(/Martin and Rebecca Cate/)).toBeInTheDocument();

      const input = screen.getByRole('searchbox');
      await user.type(input, 'mai tai');

      // About card should be hidden during search
      expect(screen.queryByText(/Martin and Rebecca Cate/)).not.toBeInTheDocument();
    });

    it('back button navigates correctly', async () => {
      await mockRouter.push('/');
      await mockRouter.push(`/source/${TEST_BOOK.type}/${TEST_BOOK.slug}`);

      const backSpy = vi.spyOn(mockRouter, 'back');

      const { user } = setupApp(
        await SourcePage({
          params: Promise.resolve({ type: TEST_BOOK.type, name: TEST_BOOK.slug }),
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
          params: Promise.resolve({ type: TEST_BOOK.type, name: TEST_BOOK.slug }),
        }),
        { nuqsOptions: { searchParams: '?search=jungle' } },
      );

      const input = screen.getByRole('searchbox');
      expect(input).toHaveValue('jungle');

      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent('Jungle bird');
    });

    it('clearing search restores full page content', async () => {
      const { user } = setupApp(
        await SourcePage({
          params: Promise.resolve({ type: TEST_BOOK.type, name: TEST_BOOK.slug }),
        }),
        { nuqsOptions: { searchParams: '?search=jungle' } },
      );

      // Initially filtered - about card hidden
      expect(screen.queryByText(/Martin and Rebecca Cate/)).not.toBeInTheDocument();

      // Clear the search
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      // About card should be restored
      expect(screen.getByText(/Martin and Rebecca Cate/)).toBeInTheDocument();
      expect(screen.getByText('All Recipes')).toBeInTheDocument();
    });
  });

  describe('with youtube-channel source type', () => {
    it('renders youtube channel source correctly', async () => {
      setupApp(
        await SourcePage({
          params: Promise.resolve({
            type: TEST_YOUTUBE.type,
            name: TEST_YOUTUBE.slug,
          }),
        }),
      );

      // Source name appears in the about card
      expect(screen.getByText(TEST_YOUTUBE.name)).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('search works with youtube channel recipes', async () => {
      const { user } = setupApp(
        await SourcePage({
          params: Promise.resolve({
            type: TEST_YOUTUBE.type,
            name: TEST_YOUTUBE.slug,
          }),
        }),
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'margarita');

      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent(/margarita/i);
    });
  });
});
