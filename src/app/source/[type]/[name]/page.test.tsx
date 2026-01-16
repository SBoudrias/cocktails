import { screen } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { vi, describe, it, expect } from 'vitest';
import { setupApp } from '@/testing';
import SourcePage from './page';

// Note: Book sources now have their own dedicated route at /source/book/[name]
// This test file tests the shared source page for non-book sources.

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
