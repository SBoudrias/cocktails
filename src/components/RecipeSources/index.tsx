'use client';

import { Recipe } from '@/types/Recipe';
import { Source } from '@/types/Source';
import { Card } from 'antd-mobile';
import { FiBook, FiYoutube, FiExternalLink } from 'react-icons/fi';
import Video from '@/components/Video';

export default function RecipeSources({
  source,
  recipe,
}: {
  source: Source;
  recipe: Recipe;
}) {
  let attribution;
  switch (source.type) {
    case 'book':
      attribution = (
        <Card
          title={
            <>
              <FiBook style={{ fontSize: '18px' }} /> {source.name}
            </>
          }
          extra={
            <a href={source.link} target="_blank" rel="noreferrer">
              <FiExternalLink
                style={{ fontSize: '18px' }}
                title="View on publisher website"
              />
            </a>
          }
          style={{ margin: 12 }}
        >
          {source.description}
        </Card>
      );
      break;
    case 'youtube-channel':
      attribution = (
        <Card
          title={
            <>
              <FiYoutube style={{ fontSize: '18px' }} /> {source.name}
            </>
          }
          extra={
            <a href={source.link} target="_blank" rel="noreferrer">
              <FiExternalLink style={{ fontSize: '18px' }} title="View on Youtube" />
            </a>
          }
          style={{ margin: 12 }}
        >
          {source.description}
        </Card>
      );
      break;
  }

  return (
    <>
      {recipe.refs.map((ref) => {
        if (ref.type === 'youtube') {
          return (
            <Video
              key={ref.videoId}
              id={ref.videoId}
              opts={{ playerVars: { start: ref.start } }}
            />
          );
        }
      })}
      {attribution}
    </>
  );
}
