import path from 'node:path';

export const PACKAGE_ROOT = path.join(import.meta.dirname, '../../data');
export const REPO_ROOT = path.join(PACKAGE_ROOT, '..');
export const APPROVED_OVERLAPS_PATH = path.join(PACKAGE_ROOT, 'approved-overlaps.json');
