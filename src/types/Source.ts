type Type = 'book' | 'article' | 'video';

export type Book = {
  type: 'book';
  title: string;
  author: string;
  page: number;
  edition?: string;
};

export type Video = {
  type: 'video';
  platform: { name: 'youtube'; id: string } | 'other';
  title: string;
  author: string;
  link: string;
};

export type Article = {
  type: 'article';
  title: string;
  link: string;
};

export type Source = Book | Video | Article;
