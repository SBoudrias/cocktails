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
