// lucide-react ships no brand logos (removed in its 1.x line), so the two
// brand marks the app needs come from simple-icons. The wrapper keeps MUI
// SvgIcon's 24px default and a11y handling; the glyph itself is the
// library's, not our own.
import { siYoutube } from 'simple-icons';

export default function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
      <path d={siYoutube.path} />
    </svg>
  );
}
