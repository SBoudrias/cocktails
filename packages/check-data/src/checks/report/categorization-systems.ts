import { ctx } from '../../context/data-context.ts';
import { report } from '../../infra/report.ts';

/**
 * Categorization system files: each system declares its category nodes and
 * the top-level categories it covers. Every ingredient of a covered family
 * must be a member of one of the system's nodes, or appear in its exemptions
 * with a reason — so a rum bottle added to the catalog cannot ship without
 * its Minimalist Tiki style (or a written reason why it has none).
 *
 * Category names are globally unique across systems: the flat `categories`
 * array on ingredients cannot say which system a name came from, so two
 * systems sharing a name would be ambiguous. Parents stay within the system.
 */
export function reportCategorizationSystems(): void {
  const systemOfNode = new Map<string, string>();

  for (const system of ctx.categorizationSystems) {
    const nodeNames = new Set(system.nodes.map((node) => node.name));

    const covers = system.covers ?? [];
    if (covers.length === 0) {
      report.fail(
        `System ${system.slug} declares no covers: every system must say which top-level categories it classifies`,
      );
    }
    for (const coverName of covers) {
      const coveredElsewhere = [...systemOfNode.entries()].find(
        ([name, slug]) => name === coverName && slug !== system.slug,
      );
      if (coveredElsewhere) {
        report.fail(
          `Cover category "${coverName}" of ${system.slug} is a node of ${coveredElsewhere[1]}: covers must be root categories`,
        );
      }
      if (
        !ctx.categoryCanonicalNames.has(
          coverName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        )
      ) {
        report.fail(
          `System ${system.slug} covers unknown category "${coverName}": no category or system node with that name exists`,
        );
      }
    }

    for (const node of system.nodes) {
      const owner = systemOfNode.get(node.name);
      if (owner && owner !== system.slug) {
        report.fail(
          `Category name "${node.name}" is declared in both ${owner}.json and ${system.slug}.json: names must be unique across systems`,
        );
      }
      systemOfNode.set(node.name, system.slug);

      for (const parentName of node.parents ?? []) {
        if (!nodeNames.has(parentName)) {
          report.fail(
            `Node "${node.name}" in ${system.slug}.json has parent "${parentName}" outside its system: parents must stay within the system`,
          );
        }
      }
    }
  }

  const nodesBySystem = new Map(
    ctx.categorizationSystems.map((system) => [
      system.slug,
      new Set(system.nodes.map((node) => node.name)),
    ]),
  );

  for (const system of ctx.categorizationSystems) {
    for (const { ingredient, reason } of system.exemptions ?? []) {
      if (!ctx.ingredientCategories.has(ingredient)) {
        report.fail(
          `Exemption in ${system.slug}.json names unknown ingredient "${ingredient}": fix the name or remove the exemption`,
        );
      }
      if (!reason.trim()) {
        report.fail(`Exemption for "${ingredient}" in ${system.slug}.json has no reason`);
      }
    }
  }

  // Membership: every ingredient of a covered family is a member of one of
  // the covering system's nodes, or explicitly exempted with a reason.
  for (const [ingredientName, categories] of ctx.ingredientCategories) {
    for (const system of ctx.categorizationSystems) {
      const covers = system.covers ?? [];
      if (!covers.some((cover) => categories.includes(cover))) continue;

      const nodeNames = nodesBySystem.get(system.slug)!;
      const isMember = categories.some((category) => nodeNames.has(category));
      const exempted = (system.exemptions ?? []).some(
        (exemption) => exemption.ingredient === ingredientName,
      );

      if (!isMember && !exempted) {
        const covered = covers.find((cover) => categories.includes(cover));
        report.fail(
          `"${ingredientName}" is in "${covered}" but has no ${system.name} category and no exemption in ${system.slug}.json: add the matching category or an exemption with a reason`,
        );
      }
    }
  }
}
