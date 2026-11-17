// lucide-react ships no brand logos (removed in its 1.x line), so the brand
// marks the app needs come from simple-icons. The wrapper is always
// aria-hidden — the surrounding control carries the accessible name; the
// glyph itself is the library's, not our own.
//
// Size-only API: no className — spacing and alignment belong to the caller's
// own wrapper. No size default: unsized, the parent's own svg sizing takes
// over (a button's `[&_svg:not([class*='size-'])]` rule, which also matches
// the attribute-less class). The literal union keeps the classes static.
import type { SimpleIcon } from 'simple-icons';

const sizeClasses = { 4: 'size-4', 5: 'size-5', 6: 'size-6' } as const;

export default function BrandIcon({
  icon,
  size,
}: {
  icon: SimpleIcon;
  /** Tailwind size step: 4 → size-4 (16px), 5 → 20px, 6 → 24px. */
  size?: 4 | 5 | 6;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={size ? sizeClasses[size] : undefined}
    >
      <path d={icon.path} />
    </svg>
  );
}
