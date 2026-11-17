import type { LinkProps } from 'next/link';
import { LinkListItem } from '#/components/list/LinkList';

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
    <LinkListItem href={href} primary={name} secondary={source} tertiary={tertiary} />
  );
}
