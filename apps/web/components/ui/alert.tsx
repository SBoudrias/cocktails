import { cn } from 'cn';
import { CircleAlert, TriangleAlert } from 'lucide-react';
import { match } from 'ts-pattern';

// A dark-theme alert: small text on a 4px-radius block tinted near-black
// toward the channel's hue (the literal hexes are derived colors, not theme
// tokens), 6px/16px padding; the icon column carries the channel token
// (22px glyphs at 90% opacity, 12px right margin, 7px vertical padding),
// the message 8px vertical padding. The glyphs are lucide's stroked icons.
export function Alert({
  severity,
  children,
}: {
  severity: 'warning' | 'error';
  children: React.ReactNode;
}) {
  const { rootClass, iconClass, Icon } = match(severity)
    .with('warning', () => ({
      rootClass: 'text-[#F7DDC3] bg-[#17110A]',
      iconClass: 'text-(--warning)',
      Icon: TriangleAlert,
    }))
    .with('error', () => ({
      rootClass: 'text-[#E9D0DA] bg-[#140D10]',
      iconClass: 'text-destructive',
      Icon: CircleAlert,
    }))
    .exhaustive();

  return (
    <div role="alert" className={cn('flex rounded-sm px-4 py-1.5 text-sm', rootClass)}>
      <div
        aria-hidden="true"
        className={cn('mr-3 flex py-1.75 text-[22px] leading-none opacity-90', iconClass)}
      >
        <Icon className="size-[22px]" />
      </div>
      <div className="min-w-0 overflow-auto py-2">{children}</div>
    </div>
  );
}
