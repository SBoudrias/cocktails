import type { Ref, BookRef, YoutubeRef } from '@/types/Ref';
import type { Source } from '@/types/Source';
import { type SxProps } from '@mui/material';
import BookAboutCard from './Book';
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
  if (source.type === 'book') {
    const ref = refs.find(
      (ref): ref is BookRef => ref.type === 'book' && ref.title === source.slug,
    );
    return <BookAboutCard source={source} ref={ref} sx={sx} />;
  } else {
    const ref = refs.find((ref): ref is YoutubeRef => ref.type === 'youtube');
    return <YoutubeAboutCard source={source} ref={ref} sx={sx} />;
  }
}
