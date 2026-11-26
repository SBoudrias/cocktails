import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AdaptiveLimiter,
  deployNetlify,
  encodeDeployPath,
  parseRateLimitWaitMs,
} from './deploy-netlify.ts';

let deployDir: string;

beforeEach(async () => {
  deployDir = await mkdtemp(path.join(tmpdir(), 'netlify-deploy-'));
});

afterEach(async () => {
  await rm(deployDir, { recursive: true, force: true });
});

async function writeFixture(relativePath: string, content: string): Promise<string> {
  const fullPath = path.join(deployDir, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content, 'utf8');
  return createHash('sha1').update(content).digest('hex');
}

const noopSleep = async () => {};
const noopLog = () => {};

describe('encodeDeployPath', () => {
  it('encodes individual segments while preserving path slashes', () => {
    expect(encodeDeployPath('pr-preview/pr-1/my recipe.html')).toBe(
      'pr-preview/pr-1/my%20recipe.html',
    );
    expect(encodeDeployPath('recipes/book/$d$slug/__PAGE__.txt')).toBe(
      'recipes/book/%24d%24slug/__PAGE__.txt',
    );
  });
});

describe('parseRateLimitWaitMs', () => {
  it('prefers X-RateLimit-Reset epoch timestamps, handles relative seconds, and falls back to Retry-After', () => {
    const now = 1_700_000_000_000;
    expect(
      parseRateLimitWaitMs(
        new Headers({ 'X-RateLimit-Reset': String(now / 1_000 + 12) }),
        now,
      ),
    ).toBe(12_250);
    expect(parseRateLimitWaitMs(new Headers({ 'X-RateLimit-Reset': '8' }), now)).toBe(
      8_250,
    );
    expect(parseRateLimitWaitMs(new Headers({ 'Retry-After': '4' }), now)).toBe(4_000);
    expect(parseRateLimitWaitMs(new Headers(), now)).toBeNull();
  });
});

describe('AdaptiveLimiter', () => {
  it('never exceeds the reduced limit when many waiters wake up', async () => {
    const limiter = new AdaptiveLimiter(6, 2);
    limiter.decrease(); // 6 -> 4
    limiter.decrease(); // 4 -> 3
    expect(limiter.currentLimit).toBe(3);

    let inFlight = 0;
    let maxObserved = 0;

    await Promise.all(
      Array.from({ length: 12 }, async () => {
        await limiter.acquire();
        inFlight++;
        maxObserved = Math.max(maxObserved, inFlight);
        await new Promise((resolve) => setTimeout(resolve, 2));
        inFlight--;
        limiter.release();
      }),
    );

    expect(maxObserved).toBe(3);
  });
});

describe('deployNetlify', () => {
  it('hashes files, deduplicates identical SHAs, uploads only required files, and waits for ready', async () => {
    const indexSha = await writeFixture('index.html', '<h1>hello</h1>');
    const dupSha = await writeFixture('nested/copy.html', '<h1>hello</h1>');
    const cachedSha = await writeFixture('cached.txt', 'already on netlify');
    expect(dupSha).toBe(indexSha);

    const uploadedPaths: string[] = [];
    let createPayload: unknown;
    let pollCount = 0;

    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method ?? 'GET';

      if (method === 'POST' && url.includes('/sites/site-123/deploys')) {
        expect(url).toContain('title=PR+%2342');
        expect(typeof init?.body).toBe('string');
        createPayload = JSON.parse(typeof init?.body === 'string' ? init.body : '');
        return Response.json({
          id: 'deploy-1',
          state: 'preparing',
          branch: 'deploy-preview-42',
          context: 'branch-deploy',
        });
      }

      if (method === 'GET' && url.endsWith('/sites/site-123/deploys/deploy-1')) {
        pollCount++;
        if (pollCount === 1) {
          return Response.json({
            id: 'deploy-1',
            state: 'prepared',
            required: [indexSha],
          });
        }
        return Response.json({
          id: 'deploy-1',
          state: 'ready',
          deploy_ssl_url: 'https://deploy-preview-42--indexotica.netlify.app',
        });
      }

      if (method === 'PUT' && url.includes('/deploys/deploy-1/files/')) {
        uploadedPaths.push(url.split('/files/')[1]!);
        expect(init?.headers).toEqual(
          expect.objectContaining({
            Authorization: 'Bearer secret-token',
            'Content-Type': 'application/octet-stream',
          }),
        );
        return Response.json({ ok: true });
      }

      throw new Error(`Unexpected request: ${method} ${url}`);
    });

    const result = await deployNetlify({
      dir: deployDir,
      siteId: 'site-123',
      token: 'secret-token',
      alias: 'deploy-preview-42',
      message: 'PR #42',
      concurrency: 4,
      pollIntervalMs: 1,
      fetchImpl: fetchMock,
      sleepImpl: noopSleep,
      log: noopLog,
    });

    expect(createPayload).toEqual({
      files: {
        '/index.html': indexSha,
        '/nested/copy.html': dupSha,
        '/cached.txt': cachedSha,
      },
      draft: false,
      branch: 'deploy-preview-42',
      async: false,
    });

    // Only one file uploaded for the duplicated SHA, and cached.txt was skipped.
    expect(uploadedPaths).toHaveLength(1);
    expect(result).toEqual({
      deployId: 'deploy-1',
      deployUrl: 'https://deploy-preview-42--indexotica.netlify.app',
      totalFiles: 3,
      uniqueFiles: 2,
      uploadedFiles: 1,
      retries: 0,
      rateLimits: 0,
    });
  });

  it('cancels and fails if Netlify ignores the requested branch alias', async () => {
    await writeFixture('index.html', '<h1>preview</h1>');
    let cancelled = false;

    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method ?? 'GET';

      if (method === 'POST' && url.includes('/sites/site-123/deploys')) {
        return Response.json({
          id: 'deploy-bad-branch',
          state: 'prepared',
          branch: 'main',
        });
      }
      if (method === 'POST' && url.endsWith('/deploys/deploy-bad-branch/cancel')) {
        cancelled = true;
        return Response.json({ id: 'deploy-bad-branch', state: 'canceled' });
      }
      throw new Error(`Unexpected request: ${method} ${url}`);
    });

    await expect(
      deployNetlify({
        dir: deployDir,
        siteId: 'site-123',
        token: 'tok',
        alias: 'deploy-preview-42',
        fetchImpl: fetchMock,
        sleepImpl: noopSleep,
        log: noopLog,
      }),
    ).rejects.toThrow('ignored branch alias');

    expect(cancelled).toBe(true);
  });

  it('retries HTTP 429 rate limits (honoring X-RateLimit-Reset and stepping down concurrency) and transient 502 errors', async () => {
    const fileSha = await writeFixture('index.html', '<html>ok</html>');
    const sleepCalls: number[] = [];
    const logs: string[] = [];
    let putAttempts = 0;

    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method ?? 'GET';

      if (method === 'POST' && url.includes('/sites/site-1/deploys')) {
        return Response.json({
          id: 'deploy-2',
          state: 'prepared',
          required: [fileSha],
        });
      }

      if (method === 'PUT' && url.includes('/deploys/deploy-2/files/')) {
        putAttempts++;
        if (putAttempts === 1) {
          return new Response('slow down', {
            status: 429,
            headers: {
              'X-RateLimit-Limit': '500',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1_000) + 5),
            },
          });
        }
        if (putAttempts === 2) {
          return new Response('bad gateway', { status: 502 });
        }
        return Response.json({ ok: true });
      }

      if (method === 'GET' && url.endsWith('/sites/site-1/deploys/deploy-2')) {
        return Response.json({
          id: 'deploy-2',
          state: 'ready',
          deploy_ssl_url: 'https://deploy-preview-9--indexotica.netlify.app',
        });
      }

      throw new Error(`Unexpected request: ${method} ${url}`);
    });

    const result = await deployNetlify({
      dir: deployDir,
      siteId: 'site-1',
      token: 'tok',
      alias: 'deploy-preview-9',
      concurrency: 10,
      pollIntervalMs: 1,
      fetchImpl: fetchMock,
      sleepImpl: async (ms) => {
        sleepCalls.push(ms);
      },
      log: (line) => {
        logs.push(line);
      },
    });

    expect(putAttempts).toBe(3);
    expect(result.retries).toBe(2);
    expect(result.rateLimits).toBe(1);
    expect(sleepCalls[0]).toBeGreaterThanOrEqual(4_000);
    expect(logs.some((line) => line.includes('concurrency -> 8'))).toBe(true);
  });

  it('cancels the deploy when an upload fails with a non-retryable 422', async () => {
    const fileSha = await writeFixture('index.html', '<html>bad</html>');
    let cancelled = false;

    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method ?? 'GET';

      if (method === 'POST' && url.includes('/sites/site-1/deploys')) {
        return Response.json({
          id: 'deploy-3',
          state: 'prepared',
          required: [fileSha],
        });
      }
      if (method === 'PUT') {
        return new Response('unprocessable', { status: 422 });
      }
      if (method === 'POST' && url.endsWith('/deploys/deploy-3/cancel')) {
        cancelled = true;
        return Response.json({ id: 'deploy-3', state: 'canceled' });
      }
      throw new Error(`Unexpected request: ${method} ${url}`);
    });

    await expect(
      deployNetlify({
        dir: deployDir,
        siteId: 'site-1',
        token: 'tok',
        alias: 'deploy-preview-3',
        fetchImpl: fetchMock,
        sleepImpl: noopSleep,
        log: noopLog,
      }),
    ).rejects.toThrow('HTTP 422');

    expect(cancelled).toBe(true);
  });

  it('rejects empty directories and filenames with # or ?', async () => {
    await expect(
      deployNetlify({
        dir: deployDir,
        siteId: 'site-1',
        token: 'tok',
        alias: 'deploy-preview-0',
        fetchImpl: vi.fn(),
        sleepImpl: noopSleep,
        log: noopLog,
      }),
    ).rejects.toThrow('empty directory');

    await writeFixture('bad#name.html', 'nope');
    await expect(
      deployNetlify({
        dir: deployDir,
        siteId: 'site-1',
        token: 'tok',
        alias: 'deploy-preview-0',
        fetchImpl: vi.fn(),
        sleepImpl: noopSleep,
        log: noopLog,
      }),
    ).rejects.toThrow('Invalid filename');
  });
});
