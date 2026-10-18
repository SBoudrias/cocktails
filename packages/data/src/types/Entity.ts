import type { Source } from './Source.ts';

export type AuthorSourceRef = {
  type: 'book' | 'youtube-channel' | 'podcast';
  slug: string;
};

export type Author = {
  name: string;
  slug: string;
  links?: [string, ...string[]];
  description?: string;
  /** Slugs of bar entities where the author worked, when verified. */
  bars?: [string, ...string[]];
  /** Catalog sources the author is behind — channel host, book author. */
  sources?: [AuthorSourceRef, ...AuthorSourceRef[]];
};

export type Bar = {
  name: string;
  slug: string;
  location?: string;
  links?: [string, ...string[]];
  description?: string;
};

/**
 * Author entity with its bars and sources references resolved to objects —
 * the shape the list pages pass to their clients, so every dimension of the
 * author travels on the one entity object.
 */
export type ResolvedAuthor = Omit<Author, 'bars' | 'sources'> & {
  bars: Bar[];
  sources: Source[];
};
