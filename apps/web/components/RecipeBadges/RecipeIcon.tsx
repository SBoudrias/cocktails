import { SvgIcon } from '@mui/material';
import { match } from 'ts-pattern';
import type { Shape } from './shapes';
import styles from './style.module.css';

/**
 * One badge icon in the "moonlit glass" look: a fine glass outline, the drink
 * glowing in the theme's moonlight gold, ice in pale turquoise and opaque
 * vessels in their material. `id` must be unique per shape on the page: it
 * names the drink's clip path and gradient.
 */
export default function RecipeIcon({ shape, id }: { shape: Shape; id: string }) {
  const liquid = shape.liquid ?? shape.body;
  const bodyClass = match(shape.material)
    .with('silver', () => styles.silver)
    .with('copper', () => styles.copper)
    .with('ceramic', () => styles.ceramic)
    .with(undefined, () => styles.glass)
    .exhaustive();
  const facetClass = match(shape)
    .when(
      (s) => s.ice !== undefined,
      () => styles.iceFacet,
    )
    .when(
      (s) => s.material === 'ceramic',
      () => styles.carvedFacet,
    )
    .otherwise(() => styles.facet);

  return (
    // Sized through sx, not the CSS module: emotion injects the base
    // `.MuiSvgIcon-*` font-size at runtime, after the external stylesheet, so
    // a module rule loses the cascade. sx wins it back (it is inserted after
    // the base styles) and `styles.icon` keeps only the stroke properties.
    <SvgIcon className={styles.icon} sx={{ fontSize: 56 }}>
      {shape.level !== undefined && liquid && (
        <defs>
          <linearGradient id={`${id}-drink`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className={styles.drinkTop} />
            <stop offset="1" className={styles.drinkBottom} />
          </linearGradient>
          <clipPath id={`${id}-liquid`}>
            <path d={liquid} />
          </clipPath>
        </defs>
      )}
      {shape.body && <path d={shape.body} className={bodyClass} />}
      {shape.level !== undefined && liquid && (
        <g clipPath={`url(#${id}-liquid)`}>
          <rect
            y={shape.level}
            width="24"
            height="24"
            fill={`url(#${id}-drink)`}
            className={styles.drink}
          />
          <path d={`M0 ${shape.level} H24`} className={styles.surface} />
        </g>
      )}
      {shape.ice && <path d={shape.ice} className={styles.ice} />}
      {shape.body && <path d={shape.body} className={styles.outline} />}
      {shape.parts && <path d={shape.parts} className={styles.outline} />}
      {shape.facets && <path d={shape.facets} className={facetClass} />}
      {shape.motion && <path d={shape.motion} className={styles.motion} />}
      {shape.solid && <path d={shape.solid} className={styles.solid} />}
    </SvgIcon>
  );
}
