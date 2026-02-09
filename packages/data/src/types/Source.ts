export type Book = {
  type: 'book';
  name: string;
  slug: string;
  link: string;
  description: string;
  recipeAmount: number;
};

export type YoutubeChannel = {
  type: 'youtube-channel';
  name: string;
  slug: string;
  links: [string, ...string[]];
  description: string;
  recipeAmount: number;
};

export type Podcast = {
  type: 'podcast';
  name: string;
  slug: string;
  link: string;
  description: string;
  recipeAmount: number;
};

export type Source = Book | YoutubeChannel | Podcast;
