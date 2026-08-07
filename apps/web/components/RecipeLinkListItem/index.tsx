import type { LinkProps } from 'next/link';
import { LinkListItem } from '#/components/LinkList';

const sourceTypographyProps = {
  variant: 'caption',
  sx: { lineHeight: 1.35 },
} as const;

export default function RecipeLinkListItem<RouteType>({
  name,
  href,
  source,
  tertiary,
}: {
  name: string;
  href: LinkProps<RouteType>['href'];
  source: string;
  tertiary?: React.ReactNode;
}) {
  return (
    <LinkListItem
      href={href}
      primary={name}
      secondary={source}
      secondaryTypographyProps={sourceTypographyProps}
      tertiary={tertiary}
    />
  );
}
