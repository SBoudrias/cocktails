import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { verifyInternalLinks } from './verify-internal-links.ts';

// The export gate behind the fix for the About-card bar links (#627): a
// plain `<a>` shipped without the basePath, so author pages linked to a
// path no deploy serves. The fixtures below are miniature exports, each
// exercising one verdict the gate must hand back.

const BASE_PATH = '/cocktails';

let exportDir: string;

beforeEach(async () => {
  exportDir = await mkdtemp(path.join(tmpdir(), 'export-'));
});

afterEach(async () => {
  await rm(exportDir, { recursive: true, force: true });
});

async function writePage(relativePath: string, body: string): Promise<void> {
  const full = path.join(exportDir, relativePath);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, `<!doctype html><html><body>${body}</body></html>`);
}

describe('verifyInternalLinks', () => {
  it('passes an export whose links carry the basePath and resolve', async () => {
    await writePage(
      'index.html',
      '<a href="/cocktails/list/bars/death-and-co-new-york-ny">Death &amp; Co</a>',
    );
    await writePage(
      'list/bars/death-and-co-new-york-ny.html',
      '<a href="/cocktails">home</a><a href="https://github.com">repo</a><a href="#top">top</a>',
    );

    expect(await verifyInternalLinks(exportDir, BASE_PATH)).toEqual([]);
  });

  it('fails a link missing the basePath — the shipped bug', async () => {
    await writePage(
      'list/authors/alex-day.html',
      '<a href="/list/bars/death-and-co-new-york-ny">Death &amp; Co</a>',
    );
    await writePage('list/bars/death-and-co-new-york-ny.html', '<p>ok</p>');

    const failures = await verifyInternalLinks(exportDir, BASE_PATH);
    expect(failures).toEqual([
      '/list/authors/alex-day: href="/list/bars/death-and-co-new-york-ny" is missing the basePath /cocktails',
    ]);
  });

  it('fails a basePath link to a page the export does not contain', async () => {
    await writePage(
      'index.html',
      '<a href="/cocktails/list/bars/no-such-bar">ghost bar</a>',
    );

    const failures = await verifyInternalLinks(exportDir, BASE_PATH);
    expect(failures).toEqual([
      '/: href="/cocktails/list/bars/no-such-bar" — the export has no page at /list/bars/no-such-bar',
    ]);
  });

  it('skips query strings and hash-only hrefs, and decodes %20', async () => {
    await writePage(
      'index.html',
      '<a href="/cocktails/list/bars/mai%20tai?search=x">query</a><a href="?page=2">pagination</a><a href="#section">anchor</a>',
    );
    await writePage('list/bars/mai tai.html', '<p>ok</p>');

    expect(await verifyInternalLinks(exportDir, BASE_PATH)).toEqual([]);
  });

  it('reports an empty export rather than passing vacuously', async () => {
    const failures = await verifyInternalLinks(exportDir, BASE_PATH);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('holds no HTML pages');
  });
});
