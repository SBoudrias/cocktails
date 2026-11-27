import { type ReactNode, useId } from 'react';
import { LinkListItem } from '#/components/list/LinkList';
import { ListSubheader } from '#/components/ui/list';

// The instructions block the recipe and ingredient pages share: a subheader
// (with an optional trailing action like a calculator link) above a surface
// block of numbered rows.
export default function InstructionList({
  instructions,
  title = 'Instructions',
  action,
}: {
  instructions: readonly string[];
  title?: string;
  action?: ReactNode;
}) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="py-2">
      <ListSubheader>
        <div className="flex items-center justify-between gap-2">
          <span id={headingId}>{title}</span>
          {action}
        </div>
      </ListSubheader>
      <ul aria-labelledby={headingId} className="surface">
        {instructions.map((instruction, index) => (
          <LinkListItem key={instruction} primary={`${index + 1}. ${instruction}`} />
        ))}
      </ul>
    </section>
  );
}
