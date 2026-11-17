// The section heading (20px/500/32px with its 7px bottom margin) above the
// instructions <ol>. list-decimal restores the step numbers the base
// layer's marker reset strips; the rows are 16px text under a 24px indent —
// the classes sit on the <ol> so the items inherit them.
export function InstructionSteps({
  id,
  steps,
  className,
}: {
  /** The heading div's id; the <ol> labels itself with it. */
  id: string;
  steps: readonly string[];
  className?: string;
}) {
  return (
    <div className={className}>
      <div id={id} className="mb-1.75 text-xl leading-8 font-medium">
        Instructions
      </div>
      <ol aria-labelledby={id} className="list-decimal pl-6 text-base">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
