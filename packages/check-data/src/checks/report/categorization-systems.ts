import { ctx } from '../../context/data-context.ts';
import { report } from '../../infra/report.ts';

interface SystemLike {
  slug: string;
  name: string;
  covers?: readonly string[];
  nodes: ReadonlyArray<{
    name: string;
    parents?: readonly string[];
    outsideOf?: readonly string[];
  }>;
}

/**
 * Every problem in the categorization system files, as messages.
 *
 * Each system declares its category nodes and the root categories it covers.
 * Every bottle of a covered family — a bottle whose categories reach a cover
 * through their parents, not only one naming it — must be a member of one of
 * the system's nodes, be exempted on the bottle itself (exemptFrom, with a
 * reason), or sit in a subtree marked outside the system (outsideOf on the
 * category). So a rum bottle cannot ship without its Minimalist Tiki style,
 * a written reason why it has none, or a category the system itself excludes.
 *
 * Category names are globally unique across systems: the flat `categories`
 * array on ingredients cannot say which system a name came from, so two
 * systems sharing a name would be ambiguous. Parents stay within the system.
 *
 * `parentsOf` maps every known category name (loose files and system nodes)
 * to its declared parents; `outsideOfByCategory` maps category names to the
 * systems their subtree is outside of.
 */
export function findCategorizationSystemProblems(
  systems: readonly SystemLike[],
  parentsOf: ReadonlyMap<string, readonly string[]>,
  outsideOfByCategory: ReadonlyMap<string, readonly string[]>,
  ingredientCategories: ReadonlyMap<string, readonly string[]>,
  ingredientExemptions: ReadonlyMap<string, ReadonlyMap<string, string>>,
): string[] {
  const problems: string[] = [];
  const systemOfNode = new Map<string, string>();
  const knownSystems = new Map<string, SystemLike>();
  for (const system of systems) {
    knownSystems.set(system.slug, system);
    knownSystems.set(system.name, system);
  }

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

      for (const outsideSystem of node.outsideOf ?? []) {
        if (outsideSystem === system.name || outsideSystem === system.slug) {
          problems.push(
            `Node "${node.name}" in ${system.slug}.json is marked outside its own system: remove the mark`,
          );
        } else if (!knownSystems.has(outsideSystem)) {
          problems.push(
            `Node "${node.name}" in ${system.slug}.json is marked outside unknown system "${outsideSystem}": fix the name`,
          );
        }
      }
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

  const isOutsideSubtree = (
    system: SystemLike,
    categories: readonly string[],
  ): boolean => {
    // Walk each category's lineage: a mark anywhere between the bottle's
    // category and the cover excludes the whole subtree.
    const stack = [...categories];
    const seen = new Set<string>();
    for (let name = stack.pop(); name !== undefined; name = stack.pop()) {
      if (seen.has(name)) continue;
      seen.add(name);
      const marks = outsideOfByCategory.get(name) ?? [];
      if (marks.includes(system.name) || marks.includes(system.slug)) return true;
      stack.push(...(parentsOf.get(name) ?? []));
    }
    return false;
  };

  for (const system of systems) {
    const covers = system.covers ?? [];
    const nodeNames = new Set(system.nodes.map((node) => node.name));
    const coveredBy = (categories: readonly string[]) => {
      // A bottle is of the covered family when any lineage reaches a cover.
      const stack = [...categories];
      const seen = new Set<string>();
      for (let name = stack.pop(); name !== undefined; name = stack.pop()) {
        if (seen.has(name)) continue;
        seen.add(name);
        if (covers.includes(name)) return name;
        stack.push(...(parentsOf.get(name) ?? []));
      }
      return undefined;
    };

    for (const [ingredientName, categories] of ingredientCategories) {
      const covered = coveredBy(categories);
      const exemption = ingredientExemptions.get(ingredientName);

      if (!covered) {
        // Outside the family: any exemption for this system is stale.
        if (exemption?.has(system.name) || exemption?.has(system.slug)) {
          problems.push(
            `"${ingredientName}" is exempted from ${system.name} in its own file but is not in ${covers.join(', ')}: remove the exemption`,
          );
        }
        continue;
      }

      const isMember = categories.some((category) => nodeNames.has(category));
      const exempted = exemption?.has(system.name) || exemption?.has(system.slug);

      if (isMember && exempted) {
        problems.push(
          `"${ingredientName}" has a ${system.name} category and is exempted from it in its own file: drop one`,
        );
      } else if (!isMember && !exempted && !isOutsideSubtree(system, categories)) {
        problems.push(
          `"${ingredientName}" is in "${covered}" but has no ${system.name} category, no exemption in its own file, and none of its categories is outside ${system.name}: add the matching category, an exemptFrom on the bottle, or an outsideOf mark on the category`,
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
    ctx.categoryOutsideOf,
    ctx.ingredientCategories,
    ctx.ingredientExemptions,
  )) {
    report.fail(problem);
  }
}
