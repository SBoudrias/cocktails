export type Book = {
  type: 'book';
  name: string;
  slug: string;
  link: string;
  description: string;
};

export type YoutubeChannel = {
  type: 'youtube-channel';
  name: string;
  slug: string;
  link: string;
  description: string;
};

export type Source = Book | YoutubeChannel;
