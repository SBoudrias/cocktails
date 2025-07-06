import type { Ref, BookRef, YoutubeRef } from '@/types/Ref';
import type { Source } from '@/types/Source';
import { type SxProps } from '@mui/material';
import BookAboutCard from './Book';
import YoutubeAboutCard from './Youtube';
import { match } from 'ts-pattern';
import slugify from '@sindresorhus/slugify';

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
    .exhaustive();
}
