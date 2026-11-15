// lucide-react ships no brand logos (removed in its 1.x line), so the brand
// marks the app needs come from simple-icons. The wrapper keeps MUI
// SvgIcon's a11y handling; the glyph itself is the library's, not our own.
// No size default: unsized, the parent's own svg sizing takes over (a
// button's `[&_svg:not([class*='size-'])]` rule, or an explicit className).
import type { SimpleIcon } from 'simple-icons';

export default function BrandIcon({
  icon,
  className,
}: {
  icon: SimpleIcon;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d={icon.path} />
    </svg>
  );
}
