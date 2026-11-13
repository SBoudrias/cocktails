import { SvgIcon, type SvgIconProps } from '@mui/material';
import styles from './style.module.css';

/**
 * The app's own brand mark: the carved tiki mug with its paper umbrella, the
 * same composition as the PWA icon set (tools/generate-icons.ts), redrawn
 * into a 24x24 box and painted with theme tokens so it sits on any surface.
 *
 * `mark` (default) is the simplified silhouette tuned for 24px chrome: gold
 * mug, carved face, teal canopy — no background. `detailed` adds the starry
 * night disc for large decorative use (the offline page).
 */
export default function TikiMark({
  variant = 'mark',
  ...props
}: SvgIconProps & { variant?: 'mark' | 'detailed' }) {
  return (
    <SvgIcon viewBox="0 0 24 24" {...props}>
      {variant === 'detailed' && (
        <g>
          <rect
            x="0.5"
            y="0.5"
            width="23"
            height="23"
            rx="5.5"
            className={styles.night}
          />
          <circle cx="12" cy="12.7" r="9.6" className={styles.moon} />
          <circle cx="5.2" cy="4.6" r="0.34" className={styles.star} />
          <circle cx="19.4" cy="3.4" r="0.3" className={styles.star} />
          <circle cx="21" cy="9.4" r="0.26" className={styles.star} />
          <circle cx="3" cy="12" r="0.26" className={styles.star} />
          <circle cx="4.6" cy="19.6" r="0.3" className={styles.star} />
          <circle cx="19.8" cy="19" r="0.34" className={styles.star} />
        </g>
      )}

      {/* The umbrella leans over the mug's right shoulder, so the drawing
          is scaled about its ink center to fill the viewBox — matching the
          visual weight of neighboring glyphs like the GitHub icon in the
          footer — and shifted so the ink reads centered. The detailed
          variant keeps the mug on the moon disc's center, like the PWA
          icon. */}
      <g
        transform={
          variant === 'mark'
            ? 'translate(12 11.9) scale(1.09) translate(-13.5 -11.5)'
            : undefined
        }
      >
        {/* Paper umbrella, tilted 16° over the mug's right shoulder, its stem
            tucked into the drink (the mug body drawn below covers the base). */}
        <g transform="translate(15.9 6.6) rotate(16)">
          <path d="M0 0.3 L0 -5.2" className={styles.stem} strokeWidth={0.7} />
          <path
            d="M0 -5.04
             Q-2.48 -4.5 -3.96 -2.79
             Q-2.97 -2.16 -1.98 -2.79
             Q-0.99 -2.16 0 -2.79
             Q0.99 -2.16 1.98 -2.79
             Q2.97 -2.16 3.96 -2.79
             Q2.48 -4.5 0 -5.04 Z"
            className={styles.canopy}
          />
          <path
            d="M0 -5.04 L-3.96 -2.79 M0 -5.04 L0 -2.79 M0 -5.04 L3.96 -2.79"
            className={styles.canopyRib}
            strokeWidth={0.3}
          />
        </g>

        {/* Carved mug: tapered gold body, dark rim, rum surface. */}
        <path
          d="M6.5 6.5 H17.5 L16.4 20.4 Q16.3 21.9 14.8 21.9 H9.2 Q7.7 21.9 7.6 20.4 Z"
          className={styles.mug}
        />
        <ellipse cx="12" cy="6.5" rx="5.5" ry="1.2" className={styles.mugShade} />
        <ellipse cx="12" cy="6.5" rx="4.4" ry="0.8" className={styles.drink} />

        {/* The carved face, cut down to what still reads at 24px: brow zigzag,
          half-moon eyes, small nose, toothy mouth, chin groove. */}
        <path
          d="M8.2 8.7 l0.95 -0.75 l0.95 0.75 l0.95 -0.75 l0.95 0.75 l0.95 -0.75 l0.95 0.75 l0.95 -0.75 l0.95 0.75"
          className={styles.groove}
          strokeWidth={0.45}
        />
        <path d="M8.6 9.9 q1.5 -0.9 3 0 q-1.5 1.4 -3 0 Z" className={styles.carved} />
        <path d="M12.4 9.9 q1.5 -0.9 3 0 q-1.5 1.4 -3 0 Z" className={styles.carved} />
        <path
          d="M11.4 10.6 h1.2 l0.15 1.9 q-0.75 0.45 -1.5 0 Z"
          className={styles.carved}
        />
        <rect
          x="9.7"
          y="14.3"
          width="4.6"
          height="2"
          rx="0.5"
          className={styles.carved}
        />
        <rect x="10.2" y="14.3" width="0.85" height="2" className={styles.mug} />
        <rect x="11.55" y="14.3" width="0.85" height="2" className={styles.mug} />
        <rect x="12.9" y="14.3" width="0.85" height="2" className={styles.mug} />
        <path d="M10 18.6 q2 0.7 4 0" className={styles.groove} strokeWidth={0.45} />
      </g>
    </SvgIcon>
  );
}
