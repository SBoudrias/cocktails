import { LinkListItem } from '#/components/list/LinkList';
import { List, ListSubheader } from '#/components/ui/list';

// The instructions block the recipe and ingredient pages share: a subheader
// above a surface block of numbered rows (the glass overlay and elevation
// shadow included).
export default function InstructionList({ instructions }: { instructions: string[] }) {
  return (
    <List>
      <ListSubheader>Instructions</ListSubheader>
      <div className="surface">
        {instructions.map((instruction, index) => (
          <LinkListItem key={instruction} primary={`${index + 1}. ${instruction}`} />
        ))}
      </div>
    </List>
  );
}
