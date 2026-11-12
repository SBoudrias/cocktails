import type { Ref, BookRef, YoutubeRef, PodcastRef, Source } from '@cocktails/data';
import slugify from '@sindresorhus/slugify';
import { match } from 'ts-pattern';
import BookAboutCard from './Book';
import PodcastAboutCard from './Podcast';
import YoutubeAboutCard from './Youtube';

const EMPTY_REFS: Ref[] = [];

export default function SourceAboutCard({
  source,
  chapterName,
  refs = EMPTY_REFS,
  className,
}: {
  source: Source;
  chapterName?: string;
  refs?: Ref[];
  className?: string;
}) {
  return match(source)
    .with({ type: 'book' }, (source) => {
      const ref = refs.find(
        (ref): ref is BookRef =>
          ref.type === 'book' && slugify(ref.title) === source.slug,
      );
      return (
        <BookAboutCard
          source={source}
          chapterName={chapterName}
          page={ref?.page}
          className={className}
        />
      );
    })
    .with({ type: 'youtube-channel' }, (source) => {
      const ref = refs.find((ref): ref is YoutubeRef => ref.type === 'youtube');
      return <YoutubeAboutCard source={source} videoRef={ref} className={className} />;
    })
    .with({ type: 'podcast' }, (source) => {
      const ref = refs.find((ref): ref is PodcastRef => ref.type === 'podcast');
      return (
        <PodcastAboutCard
          source={source}
          episodeTitle={ref?.episodeTitle}
          episodeLink={ref?.episodeLink}
          className={className}
        />
      );
    })
    .exhaustive();
}
