import type { Source } from './Source.ts';

export type Author = {
  name: string;
  slug: string;
  links?: [string, ...string[]];
  description?: string;
  /** Bars where the author worked — resolved from the entity file's refs. */
  bars?: Bar[];
  /** Catalog sources the author is behind — channel host, book author. */
  sources?: Source[];
};

export type Bar = {
  name: string;
  slug: string;
  location?: string;
  links?: [string, ...string[]];
  description?: string;
};
