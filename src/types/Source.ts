type SourceType = 'book' | 'video' | 'article';

type SourceBase = {
  type: SourceType;
  title: string;
  slug: string;
};

export type Book = SourceBase & {
  type: 'book';
  author: string;
  page: number;
  link: string;
  edition?: string;
};

export type Video = SourceBase & {
  type: 'video';
  platform: { name: 'youtube'; id: string } | 'other';
  author: string;
  link: string;
};

export type Article = SourceBase & {
  type: 'article';
  link: string;
};

export type Source = Book | Video | Article;
