declare module 'lite-youtube-embed';

declare namespace React.JSX {
  interface IntrinsicElements {
    'lite-youtube': React.HTMLAttributes<HTMLElement> & {
      videoid?: string;
      playlabel?: string;
      params?: string;
    };
  }
}
