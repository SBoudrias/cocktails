export type SourceType = 'book' | 'youtube-channel';

type SourceBase = {
  type: SourceType;
  name: string;
  slug: string;
};

export type Book = SourceBase & {
  type: 'book';
  link: string;
};

export type YoutubeChannel = SourceBase & {
  type: 'youtube-channel';
  link: string;
};

export type Source = Book | YoutubeChannel;
