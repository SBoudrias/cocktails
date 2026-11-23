import fs from 'node:fs/promises';
import path from 'node:path';
import slugify from '@sindresorhus/slugify';
import type {
  CategorizationSystem,
  CategorizationSystemNode,
} from '../types/CategorizationSystem.ts';
import { CATEGORIZATION_SYSTEM_ROOT } from './constants';
import { readJSONFile } from './fs';
import memo from './memo';

/**
 * A categorization system definition file: category nodes of one taxonomy
 * (e.g. Smuggler's Cove, Minimalist Tiki) declared together, with their
 * parents kept inside the system.
 */
interface SystemFile {
  name: string;
  description?: string;
  covers?: string[];
  nodes: CategorizationSystemNode[];
}

export const getCategorizationSystems = memo(
  async (): Promise<CategorizationSystem[]> => {
    const systems: CategorizationSystem[] = [];

    let files: string[];
    try {
      files = await fs.readdir(CATEGORIZATION_SYSTEM_ROOT);
    } catch {
      // No system files yet: every category is loose.
      return systems;
    }

    for (const file of files) {
      const slug = path.basename(file, '.json');
      const data = await readJSONFile<SystemFile>(
        path.join(CATEGORIZATION_SYSTEM_ROOT, file),
      );

      if (!data) continue;

      systems.push({
        ...data,
        slug,
        nodes: data.nodes.map((node) => ({ ...node, slug: slugify(node.name) })),
      });
    }

    return systems;
  },
);

/**
 * Which categorization system a category slug belongs to, if any. Loose
 * category files not claimed by a system belong to the implicit house tree.
 */
export const getSystemOfCategory = memo(
  async (slug: string) => {
    for (const system of await getCategorizationSystems()) {
      if (system.nodes.some((node) => node.slug === slug)) return system;
    }

    return undefined;
  },
  (slug) => slug,
);

/**
 * The category nodes declared inside categorization system files, keyed by
 * slug. A loose category file and a system node with the same slug are one
 * category: the loose file wins while it exists, and the system file becomes
 * the authoritative definition once the loose file is migrated away.
 */
export const getSystemCategoryNodes = memo(
  async (): Promise<
    Map<string, { systemSlug: string; data: CategorizationSystemNode }>
  > => {
    const nodes = new Map<
      string,
      { systemSlug: string; data: CategorizationSystemNode }
    >();

    for (const system of await getCategorizationSystems()) {
      for (const node of system.nodes) {
        nodes.set(slugify(node.name), { systemSlug: system.slug, data: node });
      }
    }

    return nodes;
  },
);
