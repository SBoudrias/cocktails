'use client';

import { Card } from 'antd-mobile';
import YouTube from 'react-youtube';
import style from './style.module.css';

export default function Video({
  id,
  opts,
}: {
  id: string;
  opts?: React.ComponentProps<typeof YouTube>['opts'];
}) {
  return (
    <Card title="Video">
      <YouTube className={style.player} videoId={id} opts={opts} />
    </Card>
  );
}
