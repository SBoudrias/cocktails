import { LinkListItem } from '#/components/LinkList';
import { ListSubheader } from '#/components/ui/list';

// The instructions block the recipe and ingredient pages share: a subheader
// above a surface block of numbered rows (what MUI's List + Paper square
// drew — the glass overlay and elevation-1 shadow included).
export default function InstructionList({ instructions }: { instructions: string[] }) {
  return (
    <ul className="py-2">
      <ListSubheader>Instructions</ListSubheader>
      <div className="surface">
        {instructions.map((instruction, index) => (
          <LinkListItem key={instruction} primary={`${index + 1}. ${instruction}`} />
        ))}
      </div>
    </ul>
  );
}
