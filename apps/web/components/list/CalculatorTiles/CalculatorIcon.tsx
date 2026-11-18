import { match } from 'ts-pattern';
import styles from './style.module.css';

/**
 * One calculator's icon in the "moonlit glass" look — the same paint recipe
 * as the recipe badges (RecipeBadges): fine glass outlines, gold liquids,
 * pale-turquoise water and motion, opaque vessels in their material. The
 * geometry is hand-drawn on the badges' 24px grid, one miniature per
 * calculator. Gradient and clip ids are static: the tiles render once per
 * page, under the `calc-` prefix.
 */
export default function CalculatorIcon({
  calculator,
}: {
  calculator:
    | 'acid-adjusting'
    | 'brix'
    | 'juice-clarification'
    | 'milk-clarification'
    | 'saline'
    | 'super-juice';
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={36}
      height={36}
      aria-hidden="true"
      focusable="false"
      className={styles.icon}
    >
      {match(calculator)
        .with('acid-adjusting', () => {
          // The titration flask: gold solution to the shoulder, bubbles.
          const body =
            'M9.5 2.5h5v5l4.6 9.2a1.6 1.6 0 0 1-1.45 2.3H6.35a1.6 1.6 0 0 1-1.45-2.3L9.5 7.5Z';
          return (
            <>
              <defs>
                <linearGradient id="calc-acid-drink" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" className={styles.drinkTop} />
                  <stop offset="1" className={styles.drinkBottom} />
                </linearGradient>
                <clipPath id="calc-acid-liquid">
                  <path d={body} />
                </clipPath>
              </defs>
              <path d={body} className={styles.glass} />
              <g className={styles.drink} clipPath="url(#calc-acid-liquid)">
                <rect y="13" width="24" height="24" fill="url(#calc-acid-drink)" />
                <path d="M6 13h12" className={styles.drinkSurface} />
              </g>
              <path d={body} className={styles.outline} />
              <path d="M10.8 17.2v-1.6M13.3 17.8v-2.4" className={styles.motion} />
            </>
          );
        })
        .with('brix', () => (
          <>
            {/* Two isometric sugar cubes (the badges' ice-cube geometry) and
                a few falling grains. */}
            <path
              d="M9 6L14.5 8.75V14.25L9 17L3.5 14.25V8.75Z"
              className={styles.glass}
            />
            <path
              d="M9 6L14.5 8.75V14.25L9 17L3.5 14.25V8.75Z"
              className={styles.outline}
            />
            <path d="M3.5 8.75L9 11.5L14.5 8.75M9 11.5V17" className={styles.facet} />
            <path
              d="M17.5 3.5L21 5.25V8.75L17.5 11.5L14 8.75V5.25Z"
              className={styles.glass}
            />
            <path
              d="M17.5 3.5L21 5.25V8.75L17.5 11.5L14 8.75V5.25Z"
              className={styles.outline}
            />
            <path d="M14 5.25L17.5 7L21 5.25M17.5 7V11.5" className={styles.facet} />
            <circle cx="5" cy="3.4" r="0.9" className={styles.solid} />
            <circle cx="9" cy="2.4" r="0.7" className={styles.solid} />
          </>
        ))
        .with('juice-clarification', () => {
          // A lab funnel of cloudy gold juice dripping into a squat rocks
          // glass of clarified, near-clear juice: cloudy in, clear out.
          const funnel = 'M7.2 2.8H16.8L13.3 7.4V11.6H10.7V7.4Z';
          const glass =
            'M7.6 17.9H16.4L15.6 20.5Q15.5 21.5 14.6 21.5H9.4Q8.5 21.5 8.4 20.5Z';
          return (
            <>
              <defs>
                <linearGradient id="calc-juice-drink" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" className={styles.drinkTop} />
                  <stop offset="1" className={styles.drinkBottom} />
                </linearGradient>
                <clipPath id="calc-juice-funnel">
                  <path d={funnel} />
                </clipPath>
                <clipPath id="calc-juice-glass">
                  <path d={glass} />
                </clipPath>
              </defs>
              <path d={funnel} className={styles.glass} />
              <g className={styles.drink} clipPath="url(#calc-juice-funnel)">
                <rect y="5.6" width="24" height="24" fill="url(#calc-juice-drink)" />
                <path d="M9 5.6h6" className={styles.drinkSurface} />
              </g>
              <path d={funnel} className={styles.outline} />
              <path d="M12 13.2v1.3M12 16.1v1.3" className={styles.motion} />
              <path d={glass} className={styles.glass} />
              <g clipPath="url(#calc-juice-glass)">
                <rect y="19.4" width="24" height="24" className={styles.clear} />
                <path d="M8 19.4h8" className={styles.clearSurface} />
              </g>
              <path d={glass} className={styles.outline} />
            </>
          );
        })
        .with('milk-clarification', () => (
          <>
            {/* The milk bottle: white to 45%, carved wave, gold cap. */}
            <path
              d="M9.3 2.5h5.4v3l1.6 2.2V19.5a1.9 1.9 0 0 1-1.9 1.9H9.6a1.9 1.9 0 0 1-1.9-1.9V7.7l1.6-2.2Z"
              className={styles.milk}
            />
            <path
              d="M9.3 2.5h5.4v3l1.6 2.2V19.5a1.9 1.9 0 0 1-1.9 1.9H9.6a1.9 1.9 0 0 1-1.9-1.9V7.7l1.6-2.2Z"
              className={styles.outline}
            />
            <path d="M8 14.2q2 1.4 4 0t4 0" className={styles.carved} />
            <path d="M9.3 2.5h5.4v1.5h-5.4Z" className={styles.solid} />
          </>
        ))
        .with('saline', () => (
          <>
            {/* The classic table salt shaker: domed silver cap with holes,
                squat glass body half-full of salt. */}
            <path
              d="M8.7 6.4V4.9Q8.7 2.7 12 2.7Q15.3 2.7 15.3 4.9V6.4Z"
              className={styles.silver}
            />
            <circle cx="10.5" cy="4.7" r="0.45" className={styles.hole} />
            <circle cx="12" cy="4.3" r="0.45" className={styles.hole} />
            <circle cx="13.5" cy="4.7" r="0.45" className={styles.hole} />
            <circle cx="11.2" cy="5.7" r="0.45" className={styles.hole} />
            <circle cx="12.8" cy="5.7" r="0.45" className={styles.hole} />
            <path
              d="M9.2 6.4H14.8L16 19.6Q16 21.6 14 21.6H10Q8 21.6 8 19.6Z"
              className={styles.glass}
            />
            <path
              d="M8.62 12.8H15.38L16 19.6Q16 21.6 14 21.6H10Q8 21.6 8 19.6Z"
              className={styles.salt}
            />
            <path d="M8.8 13.4q1.6-1 3.2 0t3.2 0" className={styles.saltWave} />
            <path
              d="M9.2 6.4H14.8L16 19.6Q16 21.6 14 21.6H10Q8 21.6 8 19.6Z"
              className={styles.outline}
            />
            <path
              d="M8.7 6.4V4.9Q8.7 2.7 12 2.7Q15.3 2.7 15.3 4.9V6.4Z"
              className={styles.outline}
            />
          </>
        ))
        .with('super-juice', () => (
          <>
            {/* The lime half in its own green, gold sparkle for the "super". */}
            <path
              d="M6.4 9.6a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0Z"
              className={styles.lime}
            />
            <path
              d="M12 9.6V4M12 9.6V15.2M12 9.6L16.85 12.4M12 9.6L7.15 12.4M12 9.6L16.85 6.8M12 9.6L7.15 6.8"
              className={styles.facet}
            />
            <path
              d="M6.4 9.6a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0Z"
              className={styles.outline}
            />
            <path
              d="M18.5 2.6L19.2 3.8L20.4 4.5L19.2 5.2L18.5 6.4L17.8 5.2L16.6 4.5L17.8 3.8Z"
              className={styles.solid}
            />
            <circle cx="20.8" cy="8.2" r="0.8" className={styles.solid} />
          </>
        ))
        .exhaustive()}
    </svg>
  );
}
