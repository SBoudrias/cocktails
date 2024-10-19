'use client';

import { Recipe } from '@/types/Recipe';
import { Source } from '@/types/Source';
import { Card, Space } from 'antd-mobile';
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
        >
          {source.description}
        </Card>
      );
      break;
  }

  return (
    <Space direction="vertical" style={{ '--gap': '12px', margin: '24px 12px' }}>
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
    </Space>
  );
}
