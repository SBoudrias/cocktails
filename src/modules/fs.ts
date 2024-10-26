import fs from 'node:fs/promises';

export async function fileExists(filepath: string): Promise<boolean> {
  return fs.access(filepath).then(
    () => true,
    () => false,
  );
}

export async function readJSONFile<T>(filepath: string): Promise<T | undefined> {
  if (await fileExists(filepath)) {
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  }

  return undefined;
}
