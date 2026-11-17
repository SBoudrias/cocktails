// lucide-react ships no brand logos (removed in its 1.x line), so the brand
// marks the app needs come from simple-icons. The wrapper is always
// aria-hidden — the surrounding control carries the accessible name; the
// glyph itself is the library's, not our own.
//
// Size-only API: no className — spacing and alignment belong to the shared
// containers (CardTitle, the text buttons), which rule classless svgs via
// their `[&>svg:not([class*='size-'])]` selectors; a classless svg is how
// BrandIcon opts into them. Size lands as width/height attributes, the
// TikiMark convention: CSS container rules (a button's 20px default)
// override them, so where a container owns sizing, unsized is the right
// call. The semantic tokens follow ui-sdk's data-size naming.
import type { SimpleIcon } from 'simple-icons';

const sizes = { sm: 16, md: 20, lg: 24 } as const;

export default function BrandIcon({
  icon,
  size,
}: {
  icon: SimpleIcon;
  /** Semantic size: sm → 16px, md → 20px, lg → 24px. */
  size?: keyof typeof sizes;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      width={size ? sizes[size] : undefined}
      height={size ? sizes[size] : undefined}
    >
      <path d={icon.path} />
    </svg>
  );
}
