import { List, ListRow, ListSubheader } from '#/components/ui/list';

/**
 * The numbered instructions the technique calculators render below their
 * card: a subheader above a surface block of divider rows, each row numbered
 * like a recipe's steps.
 */
export function CalculatorInstructions({ steps }: { steps: readonly string[] }) {
  return (
    <section aria-label="Instructions">
      <List>
        <li>
          <ListSubheader>Instructions</ListSubheader>
          <ul className="surface">
            {steps.map((step, index) => (
              <ListRow key={step}>
                <span className="my-1 flex-1 text-left">
                  {index + 1}. {step}
                </span>
              </ListRow>
            ))}
          </ul>
        </li>
      </List>
    </section>
  );
}
