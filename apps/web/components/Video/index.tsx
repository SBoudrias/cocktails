'use client';

import { YouTubeEmbed } from '@next/third-parties/google';
import style from './style.module.css';

export default function Video({ id, start }: { id: string; start?: number }) {
  const searchParams = new URLSearchParams();
  if (start) {
    searchParams.set('start', start.toString());
  }

  return (
    <div className={style.wrapper}>
      <div className={style.player}>
        <YouTubeEmbed videoid={id} params={searchParams.toString()} />
      </div>
    </div>
  );
}
