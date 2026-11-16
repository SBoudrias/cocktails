// lucide-react ships no brand logos (removed in its 1.x line), so the two
// brand marks the app needs come from simple-icons. The wrapper is always
// aria-hidden — the surrounding control carries the accessible name — with
// a 24px default; the glyph itself is the library's, not our own.
import { siGithub } from 'simple-icons';

export default function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
      <path d={siGithub.path} />
    </svg>
  );
}
