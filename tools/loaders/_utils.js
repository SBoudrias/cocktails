import fs from 'node:fs/promises';

export async function writeJSON(filepath, data) {
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  await fs.writeFile(filepath, JSON.stringify(data, null, 2) + '\n');
}
