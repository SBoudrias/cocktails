// lucide-react ships no brand logos, so the brand marks the app needs come
// from simple-icons. The wrapper keeps MUI SvgIcon's 24px default and a11y
// handling; the glyph itself is the library's, not our own.
import { siInstagram } from 'simple-icons';

export default function InstagramIcon({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d={siInstagram.path} />
    </svg>
  );
}
