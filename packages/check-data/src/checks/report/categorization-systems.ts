import { ctx } from '../../context/data-context.ts';
import { report } from '../../infra/report.ts';

interface SystemLike {
  slug: string;
  name: string;
  covers?: readonly string[];
  nodes: ReadonlyArray<{ name: string; parents?: readonly string[] }>;
  exemptions?: ReadonlyArray<{ ingredient: string; reason: string }>;
}

/**
 * Every problem in the categorization system files, as messages.
 *
 * Each system declares its category nodes and the root categories it covers.
 * Every ingredient of a covered family — a bottle whose categories reach a
 * cover through their parents, not only one naming it — must be a member of
 * one of the system's nodes, or appear in its exemptions with a reason, and
 * never both. So a rum bottle cannot ship without its Minimalist Tiki style
 * (or a written reason why it has none).
 *
 * Category names are globally unique across systems: the flat `categories`
 * array on ingredients cannot say which system a name came from, so two
 * systems sharing a name would be ambiguous. Parents stay within the system.
 *
 * `parentsOf` maps every known category name (loose files and system nodes)
 * to its declared parents.
 */
export function findCategorizationSystemProblems(
  systems: readonly SystemLike[],
  parentsOf: ReadonlyMap<string, readonly string[]>,
  ingredientCategories: ReadonlyMap<string, readonly string[]>,
): string[] {
  const problems: string[] = [];
  const systemOfNode = new Map<string, string>();

  for (const system of systems) {
    const nodeNames = new Set<string>();
    for (const node of system.nodes) {
      if (nodeNames.has(node.name)) {
        problems.push(
          `Category name "${node.name}" is declared twice in ${system.slug}.json: remove the duplicate node`,
        );
      }
      nodeNames.add(node.name);

      const owner = systemOfNode.get(node.name);
      if (owner && owner !== system.slug) {
        problems.push(
          `Category name "${node.name}" is declared in both ${owner}.json and ${system.slug}.json: names must be unique across systems`,
        );
      }
      systemOfNode.set(node.name, system.slug);
    }

    for (const node of system.nodes) {
      for (const parentName of node.parents ?? []) {
        if (!nodeNames.has(parentName)) {
          problems.push(
            `Node "${node.name}" in ${system.slug}.json has parent "${parentName}" outside its system: parents must stay within the system`,
          );
        }
      }
    }

    const covers = system.covers ?? [];
    if (covers.length === 0) {
      problems.push(
        `System ${system.slug} declares no covers: every system must say which top-level categories it classifies`,
      );
    }
    for (const coverName of covers) {
      const parents = parentsOf.get(coverName);
      if (!parents) {
        problems.push(
          `System ${system.slug} covers unknown category "${coverName}": no category or system node with that name exists`,
        );
      } else if (parents.length > 0) {
        problems.push(
          `Cover category "${coverName}" of ${system.slug} has parents (${parents.join(', ')}): covers must be root categories`,
        );
      }
    }
  }

  const ancestorsOf = (categories: readonly string[]): Set<string> => {
    const seen = new Set<string>();
    const stack = [...categories];
    for (let name = stack.pop(); name !== undefined; name = stack.pop()) {
      if (seen.has(name)) continue;
      seen.add(name);
      stack.push(...(parentsOf.get(name) ?? []));
    }
    return seen;
  };

  for (const system of systems) {
    const covers = system.covers ?? [];
    const nodeNames = new Set(system.nodes.map((node) => node.name));
    const isCovered = (categories: readonly string[]) => {
      const lineage = ancestorsOf(categories);
      return covers.find((cover) => lineage.has(cover));
    };

    const exempted = new Set<string>();
    for (const { ingredient, reason } of system.exemptions ?? []) {
      if (exempted.has(ingredient)) {
        problems.push(
          `"${ingredient}" is exempted twice in ${system.slug}.json: keep one exemption`,
        );
      }
      exempted.add(ingredient);

      const categories = ingredientCategories.get(ingredient);
      if (!categories) {
        problems.push(
          `Exemption in ${system.slug}.json names unknown ingredient "${ingredient}": fix the name or remove the exemption`,
        );
      } else if (!isCovered(categories)) {
        problems.push(
          `Exemption for "${ingredient}" in ${system.slug}.json is stale: the bottle is outside ${covers.join(', ')}, so remove the exemption`,
        );
      }
      if (!reason.trim()) {
        problems.push(
          `Exemption for "${ingredient}" in ${system.slug}.json has no reason`,
        );
      }
    }

    for (const [ingredientName, categories] of ingredientCategories) {
      const covered = isCovered(categories);
      if (!covered) continue;

      const isMember = categories.some((category) => nodeNames.has(category));
      if (isMember && exempted.has(ingredientName)) {
        problems.push(
          `"${ingredientName}" has a ${system.name} category and an exemption in ${system.slug}.json: drop one`,
        );
      } else if (!isMember && !exempted.has(ingredientName)) {
        problems.push(
          `"${ingredientName}" is in "${covered}" but has no ${system.name} category and no exemption in ${system.slug}.json: add the matching category or an exemption with a reason`,
        );
      }
    }
  }

  return problems;
}

export function reportCategorizationSystems(): void {
  const parentsOf = new Map<string, readonly string[]>();
  for (const category of ctx.allCategories) {
    parentsOf.set(category.name, [
      ...(parentsOf.get(category.name) ?? []),
      ...(category.parents ?? []),
    ]);
  }

  for (const problem of findCategorizationSystemProblems(
    ctx.categorizationSystems,
    parentsOf,
    ctx.ingredientCategories,
  )) {
    report.fail(problem);
  }
}
