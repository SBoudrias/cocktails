/**
 * Ref represent a reference to an external resource.
 *
 * When used in arrays, order by priority/relevance.
 */
export type YoutubeRef = {
  type: 'youtube';
  videoId: string;
  /** Slug of the `youtube-channel` source that published the video. */
  channel: string;
  start?: number;
};

export type BookRef = {
  type: 'book';
  title: string;
  page: number;
};

export type WebsiteRef = {
  type: 'website';
  name: string;
  url: string;
};

export type PodcastRef = {
  type: 'podcast';
  episodeTitle: string;
  episodeLink?: string;
};

export type Ref = YoutubeRef | BookRef | WebsiteRef | PodcastRef;
