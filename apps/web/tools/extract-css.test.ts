import { describe, expect, it } from 'vitest';
import { extractInlineCss } from './extract-css';

const BIG_CSS = '.a{'.padEnd(250, 'x') + '}'.padEnd(260, 'y');
const BIG_CSS_ALT = '.b{'.padEnd(250, 'z') + '}'.padEnd(260, 'w');
const TINY_CSS = '.tiny{color:red}';

describe('extractInlineCss', () => {
  it('replaces a large inline block with a link using the page basePath', () => {
    const html = `<head><link rel="stylesheet" href="/cocktails/_next/static/chunks/abc.css"><style>${BIG_CSS}</style></head>`;
    const { html: out, blocks } = extractInlineCss(html);

    expect(out).not.toContain('<style>');
    expect(out).toMatch(
      /<link rel="stylesheet" href="\/cocktails\/_next\/static\/css\/inline-[0-9a-f]+\.css"\/>/,
    );
    expect(blocks.size).toBe(1);
    expect([...blocks.values()]).toEqual([BIG_CSS]);
  });

  it('falls back to root basePath when the page has no external css link', () => {
    const { html: out } = extractInlineCss(`<head><style>${BIG_CSS}</style></head>`);
    expect(out).toMatch(/href="\/_next\/static\/css\/inline-/);
  });

  it('keeps tiny blocks inline', () => {
    const html = `<head><style>${TINY_CSS}</style></head>`;
    const { html: out, blocks } = extractInlineCss(html);
    expect(out).toContain(TINY_CSS);
    expect(blocks.size).toBe(0);
  });

  it('deduplicates identical blocks across pages', () => {
    const page = (n: number) =>
      `<head><link rel="stylesheet" href="/b/_next/static/chunks/${n}.css"><style>${BIG_CSS}</style></head>`;
    const a = extractInlineCss(page(1));
    const b = extractInlineCss(page(2));

    const aFile = [...a.blocks.keys()][0];
    const bFile = [...b.blocks.keys()][0];
    expect(aFile).toBe(bFile);
    expect(a.blocks.size).toBe(1);
    expect(b.blocks.size).toBe(1);
  });

  it('keeps distinct blocks distinct', () => {
    const { blocks } = extractInlineCss(
      `<head><style>${BIG_CSS}</style><style>${BIG_CSS_ALT}</style></head>`,
    );
    expect(blocks.size).toBe(2);
  });

  it('leaves html with no style blocks untouched', () => {
    const html = '<html><body><p>hi</p></body></html>';
    expect(extractInlineCss(html).html).toBe(html);
  });
});
