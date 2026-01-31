import type { Ref, BookRef, YoutubeRef, PodcastRef, Source } from '@cocktails/data';
import { type SxProps } from '@mui/material';
import slugify from '@sindresorhus/slugify';
import { match } from 'ts-pattern';
import BookAboutCard from './Book';
import PodcastAboutCard from './Podcast';
import YoutubeAboutCard from './Youtube';

export default function SourceAboutCard({
  source,
  refs = [],
  sx,
}: {
  source: Source;
  refs?: Ref[];
  sx?: SxProps;
}) {
  return match(source)
    .with({ type: 'book' }, (source) => {
      const ref = refs.find(
        (ref): ref is BookRef =>
          ref.type === 'book' && slugify(ref.title) === source.slug,
      );
      return <BookAboutCard source={source} page={ref?.page} sx={sx} />;
    })
    .with({ type: 'youtube-channel' }, (source) => {
      const ref = refs.find((ref): ref is YoutubeRef => ref.type === 'youtube');
      return <YoutubeAboutCard source={source} videoRef={ref} sx={sx} />;
    })
    .with({ type: 'podcast' }, (source) => {
      const ref = refs.find((ref): ref is PodcastRef => ref.type === 'podcast');
      return (
        <PodcastAboutCard
          source={source}
          episodeTitle={ref?.episodeTitle}
          episodeLink={ref?.episodeLink}
          sx={sx}
        />
      );
    })
    .exhaustive();
}
