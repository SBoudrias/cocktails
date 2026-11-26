#!/usr/bin/env -S node --no-warnings

/**
 * Direct Netlify File Digest REST API uploader for PR preview deploys.
 *
 * Replaces `npx netlify-cli deploy` in `.github/workflows/preview.yml`:
 * - avoids the ~15–22s cold `npx netlify-cli` download on every run
 * - deduplicates identical SHA-1 files before uploading (Netlify's File
 *   Digest API only requires each unique SHA-1 once, skipping ~4,800
 *   duplicate RSC files that `netlify-cli` uploads redundantly)
 * - uploads concurrently with adaptive rate-limit pacing (global
 *   `X-RateLimit-Reset` / `Retry-After` cooldown + AIMD concurrency backoff
 *   on HTTP 429)
 *
 * Note: Netlify's single-request ZIP deploy API stalls server-side on this
 * ~24k-file / ~147 MB export (near Netlify's 25k-file ZIP limit), so File
 * Digest is the only reliable API for this site size.
 *
 * Usage:
 *   node apps/web/tools/deploy-netlify.ts \
 *     --dir apps/web/deploy \
 *     --site-id "$SITE_ID" \
 *     --alias "deploy-preview-123" \
 *     --message "PR #123 @ <sha>"
 *
 * Reads NETLIFY_AUTH_TOKEN from the environment (or --token).
 * Prints `{ deploy_id, deploy_url, ... }` JSON to stdout.
 */
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { match, P } from 'ts-pattern';

const API_BASE = 'https://api.netlify.com/api/v1';
const USER_AGENT = 'indexotica-deploy/1.0';
const DEFAULT_CONCURRENCY = 16;
const MIN_CONCURRENCY = 5;
const RECOVERY_STREAK = 1_000;
const DEFAULT_HASH_CONCURRENCY = 64;
const DEFAULT_POLL_INTERVAL_MS = 1_500;
const DEFAULT_TIMEOUT_MS = 12 * 60 * 1_000;
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RATE_LIMIT_WAIT_MS = 120_000;
const SYNC_FILE_LIMIT = 100;
const MAX_API_RETRIES = 6;
const MAX_UPLOAD_RETRIES = 6;
const MAX_RATE_LIMIT_RETRIES = 40;

const DIFFED_STATES = new Set(['prepared', 'uploading', 'uploaded', 'ready']);

export interface DeployNetlifyOptions {
  dir: string;
  siteId: string;
  token: string;
  alias: string;
  message?: string;
  concurrency?: number;
  pollIntervalMs?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  sleepImpl?: (ms: number) => Promise<void>;
  log?: (line: string) => void;
}

export interface DeployNetlifyResult {
  deployId: string;
  deployUrl: string;
  totalFiles: number;
  uniqueFiles: number;
  uploadedFiles: number;
  retries: number;
  rateLimits: number;
}

interface DeployResponse {
  id: string;
  state: string;
  branch?: string;
  context?: string;
  required?: string[];
  deploy_ssl_url?: string;
  deploy_url?: string;
  error_message?: string;
}

interface HashedEntry {
  relPath: string;
  fullPath: string;
  sha1: string;
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseDeployResponse(value: unknown): DeployResponse {
  if (!isRecord(value) || typeof value.id !== 'string') {
    throw new Error(`Unexpected Netlify deploy response: ${JSON.stringify(value)}`);
  }
  return {
    id: value.id,
    state: typeof value.state === 'string' ? value.state : '',
    branch: typeof value.branch === 'string' ? value.branch : undefined,
    context: typeof value.context === 'string' ? value.context : undefined,
    required: Array.isArray(value.required)
      ? value.required.filter((entry): entry is string => typeof entry === 'string')
      : undefined,
    deploy_ssl_url:
      typeof value.deploy_ssl_url === 'string' ? value.deploy_ssl_url : undefined,
    deploy_url: typeof value.deploy_url === 'string' ? value.deploy_url : undefined,
    error_message:
      typeof value.error_message === 'string' ? value.error_message : undefined,
  };
}

/** Encode a relative POSIX file path for Netlify's `/deploys/:id/files/:path` URL. */
export function encodeDeployPath(relPath: string): string {
  return relPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

/**
 * Compute how long to wait after an HTTP 429 from Netlify.
 * Netlify sends `X-RateLimit-Reset` as a Unix epoch timestamp in seconds
 * (per `@netlify/api`'s retry logic), and may also send `Retry-After`.
 */
export function parseRateLimitWaitMs(
  headers: Pick<Headers, 'get'>,
  nowMs = Date.now(),
): number | null {
  const resetHeader = headers.get('x-ratelimit-reset');
  if (resetHeader) {
    const resetValue = Number(resetHeader);
    if (Number.isFinite(resetValue) && resetValue > 0) {
      const deltaMs =
        resetValue > 1_000_000_000 ? resetValue * 1_000 - nowMs : resetValue * 1_000;
      return Math.min(MAX_RATE_LIMIT_WAIT_MS, Math.max(1_000, Math.ceil(deltaMs) + 250));
    }
  }
  const retryAfter = headers.get('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(
        MAX_RATE_LIMIT_WAIT_MS,
        Math.max(1_000, Math.ceil(seconds * 1_000)),
      );
    }
    const dateMs = Date.parse(retryAfter);
    if (Number.isFinite(dateMs)) {
      return Math.min(MAX_RATE_LIMIT_WAIT_MS, Math.max(1_000, dateMs - nowMs));
    }
  }
  return null;
}

function formatRateLimitHeaders(headers: Pick<Headers, 'get'>): string {
  const parts = [
    ['limit', headers.get('x-ratelimit-limit')],
    ['remaining', headers.get('x-ratelimit-remaining')],
    ['reset', headers.get('x-ratelimit-reset')],
    ['retry-after', headers.get('retry-after')],
  ]
    .filter(([, value]) => value !== null)
    .map(([key, value]) => `${key}=${value}`);
  return parts.length > 0 ? parts.join(' ') : 'no rate-limit headers';
}

async function listFilesRecursive(currentDir: string): Promise<string[]> {
  const entries = await readdir(currentDir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) return listFilesRecursive(fullPath);
      if (entry.isFile()) return Promise.resolve([fullPath]);
      return Promise.resolve([]);
    }),
  );
  return nested.flat();
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (true) {
      const current = nextIndex;
      if (current >= items.length) return;
      nextIndex++;
      results[current] = await worker(items[current]!, current);
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
  return results;
}

/**
 * Dynamic concurrency gate supporting AIMD (additive increase, multiplicative
 * decrease) so workers back off smoothly if Netlify throttles uploads.
 */
class AdaptiveLimiter {
  private limit: number;
  private active = 0;
  private waiters: (() => void)[] = [];

  constructor(
    private readonly maxLimit: number,
    private readonly minLimit: number,
  ) {
    this.limit = maxLimit;
  }

  get currentLimit(): number {
    return this.limit;
  }

  async acquire(): Promise<void> {
    if (this.active < this.limit) {
      this.active++;
      return;
    }
    await new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });
    this.active++;
  }

  release(): void {
    this.active--;
    this.drain();
  }

  decrease(): number {
    this.limit = Math.max(this.minLimit, Math.floor(this.limit * 0.7));
    return this.limit;
  }

  increase(): number {
    if (this.limit < this.maxLimit) {
      this.limit++;
      this.drain();
    }
    return this.limit;
  }

  private drain(): void {
    while (this.active < this.limit && this.waiters.length > 0) {
      const next = this.waiters.shift();
      next?.();
    }
  }
}

async function apiRequest(
  fetchImpl: typeof fetch,
  sleepImpl: (ms: number) => Promise<void>,
  url: string,
  token: string,
  init: {
    method: string;
    contentType?: string;
    body?: BodyInit;
    timeoutMs?: number;
  },
): Promise<unknown> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'User-Agent': USER_AGENT,
  };
  if (init.contentType) {
    headers['Content-Type'] = init.contentType;
  }

  for (let attempt = 0; ; attempt++) {
    let status: number | undefined;
    let rateLimitWaitMs: number | null = null;
    let lastError: Error;

    try {
      const response = await fetchImpl(url, {
        method: init.method,
        body: init.body,
        signal: AbortSignal.timeout(init.timeoutMs ?? REQUEST_TIMEOUT_MS),
        headers,
      });
      const text = await response.text();
      if (response.ok) {
        return text ? JSON.parse(text) : undefined;
      }
      status = response.status;
      rateLimitWaitMs = parseRateLimitWaitMs(response.headers);
      lastError = new Error(
        `Netlify API ${init.method} ${url} failed (${status}): ${text}`,
      );
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error(String(error), { cause: error });
    }

    const retryable = match(status)
      .with(429, 408, P.number.gte(500), undefined, () => true)
      .otherwise(() => false);

    if (!retryable || attempt >= MAX_API_RETRIES) {
      throw lastError;
    }

    const waitMs =
      status === 429
        ? (rateLimitWaitMs ?? Math.min(30_000, 5_000 * (attempt + 1)))
        : Math.min(30_000, 500 * 2 ** attempt);
    await sleepImpl(waitMs);
  }
}

async function pollDeployUntil(
  fetchImpl: typeof fetch,
  sleepImpl: (ms: number) => Promise<void>,
  token: string,
  siteId: string,
  deployId: string,
  targetStates: ReadonlySet<string>,
  pollIntervalMs: number,
  deadlineMs: number,
): Promise<DeployResponse> {
  const url = `${API_BASE}/sites/${encodeURIComponent(siteId)}/deploys/${encodeURIComponent(deployId)}`;
  while (Date.now() < deadlineMs) {
    const deploy = parseDeployResponse(
      await apiRequest(fetchImpl, sleepImpl, url, token, { method: 'GET' }),
    );
    if (deploy.state === 'error') {
      throw new Error(
        `Netlify deploy ${deployId} entered error state: ${deploy.error_message ?? 'unknown error'}`,
      );
    }
    if (targetStates.has(deploy.state)) {
      return deploy;
    }
    await sleepImpl(pollIntervalMs);
  }
  throw new Error(
    `Timed out waiting for Netlify deploy ${deployId} to reach ${Array.from(targetStates).join('/')}`,
  );
}

async function cancelDeployBestEffort(
  fetchImpl: typeof fetch,
  token: string,
  deployId: string,
): Promise<void> {
  await fetchImpl(`${API_BASE}/deploys/${encodeURIComponent(deployId)}/cancel`, {
    method: 'POST',
    signal: AbortSignal.timeout(15_000),
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': USER_AGENT,
    },
  }).catch(() => {});
}

/**
 * Deploy a static directory to Netlify as a named alias deploy via the
 * File Digest REST API with SHA-1 deduplication and adaptive concurrency.
 */
export async function deployNetlify(
  options: DeployNetlifyOptions,
): Promise<DeployNetlifyResult> {
  const {
    dir,
    siteId,
    token,
    alias,
    message,
    concurrency = DEFAULT_CONCURRENCY,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fetchImpl = fetch,
    sleepImpl = defaultSleep,
    log = (line: string) => console.error(line),
  } = options;

  const startedAt = performance.now();
  const deadlineMs = Date.now() + timeoutMs;
  const elapsedSec = (since: number) => ((performance.now() - since) / 1_000).toFixed(1);

  const absoluteRoot = path.resolve(dir);
  const fullPaths = await listFilesRecursive(absoluteRoot);

  if (fullPaths.length === 0) {
    throw new Error(`Refusing to deploy empty directory: ${dir}`);
  }

  for (const fullPath of fullPaths) {
    const relPath = path.relative(absoluteRoot, fullPath).split(path.sep).join('/');
    if (relPath.includes('#') || relPath.includes('?')) {
      throw new Error(
        `Invalid filename "${relPath}": Netlify deploys cannot contain # or ? characters`,
      );
    }
  }

  const hashStart = performance.now();
  const entries = await mapWithConcurrency(
    fullPaths,
    DEFAULT_HASH_CONCURRENCY,
    async (fullPath): Promise<HashedEntry> => {
      const relPath = path.relative(absoluteRoot, fullPath).split(path.sep).join('/');
      const content = await readFile(fullPath);
      const sha1 = createHash('sha1').update(content).digest('hex');
      return { relPath, fullPath, sha1 };
    },
  );

  const files: Record<string, string> = {};
  const bySha = new Map<string, HashedEntry>();
  for (const entry of entries) {
    files[`/${entry.relPath}`] = entry.sha1;
    if (!bySha.has(entry.sha1)) {
      bySha.set(entry.sha1, entry);
    }
  }
  log(
    `netlify-deploy: hashed ${entries.length} files (${bySha.size} unique) in ${elapsedSec(hashStart)}s`,
  );

  const createUrl = new URL(`${API_BASE}/sites/${encodeURIComponent(siteId)}/deploys`);
  if (message) {
    createUrl.searchParams.set('title', message);
  }

  const diffStart = performance.now();
  const created = parseDeployResponse(
    await apiRequest(fetchImpl, sleepImpl, createUrl.href, token, {
      method: 'POST',
      contentType: 'application/json',
      body: JSON.stringify({
        files,
        draft: false,
        branch: alias,
        async: entries.length > SYNC_FILE_LIMIT,
      }),
    }),
  );
  const deployId = created.id;

  try {
    if (created.branch && created.branch !== alias) {
      throw new Error(
        `Netlify deploy ${deployId} ignored branch alias "${alias}" (got "${created.branch}")`,
      );
    }
    if (created.context === 'production') {
      throw new Error(
        `Netlify deploy ${deployId} unexpectedly targeted production context for alias "${alias}"`,
      );
    }

    const diffed = DIFFED_STATES.has(created.state)
      ? created
      : await pollDeployUntil(
          fetchImpl,
          sleepImpl,
          token,
          siteId,
          deployId,
          DIFFED_STATES,
          pollIntervalMs,
          deadlineMs,
        );

    const requiredShas = Array.from(new Set(diffed.required ?? []));
    const toUpload: HashedEntry[] = [];
    for (const sha of requiredShas) {
      const entry = bySha.get(sha);
      if (entry) toUpload.push(entry);
    }
    log(
      `netlify-deploy: diffed in ${elapsedSec(diffStart)}s — ${toUpload.length} unique files to upload (concurrency=${concurrency})`,
    );

    const uploadStart = performance.now();
    const minConcurrency = Math.min(concurrency, MIN_CONCURRENCY);
    const limiter = new AdaptiveLimiter(concurrency, minConcurrency);
    let uploadedCount = 0;
    let retries = 0;
    let rateLimits = 0;
    let cooldownUntil = 0;
    let lastBackoffWindowUntil = 0;
    let successStreak = 0;

    await mapWithConcurrency(toUpload, concurrency, async (entry) => {
      const fileUrl = `${API_BASE}/deploys/${encodeURIComponent(deployId)}/files/${encodeDeployPath(entry.relPath)}`;
      const body = await readFile(entry.fullPath);

      let transientAttempts = 0;
      let rateLimitAttempts = 0;
      let sleptCooldownUntil = 0;

      while (true) {
        const nowBeforeReq = Date.now();
        if (nowBeforeReq >= deadlineMs) {
          throw new Error(
            `Timed out uploading files to Netlify deploy ${deployId} after ${uploadedCount}/${toUpload.length} files`,
          );
        }

        if (cooldownUntil > nowBeforeReq && cooldownUntil > sleptCooldownUntil) {
          const targetCooldown = cooldownUntil;
          await sleepImpl(targetCooldown - nowBeforeReq);
          sleptCooldownUntil = targetCooldown;
        }

        let status: number | undefined;
        let rateLimitWaitMs: number | null = null;
        let rateLimitInfo = '';
        let lastError: Error;

        await limiter.acquire();
        try {
          const response = await fetchImpl(fileUrl, {
            method: 'PUT',
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
              'Content-Type': 'application/octet-stream',
              'User-Agent': USER_AGENT,
            },
            body,
          });
          if (response.ok) {
            uploadedCount++;
            successStreak++;
            if (successStreak >= RECOVERY_STREAK) {
              successStreak = 0;
              limiter.increase();
            }
            if (uploadedCount % 2_000 === 0 || uploadedCount === toUpload.length) {
              const elapsed = Math.max(0.1, (performance.now() - uploadStart) / 1_000);
              const rate = (uploadedCount / elapsed).toFixed(1);
              log(
                `netlify-deploy: uploaded ${uploadedCount}/${toUpload.length} (${elapsed.toFixed(1)}s, ${rate} files/s, concurrency=${limiter.currentLimit}, rateLimits=${rateLimits})`,
              );
            }
            return;
          }
          status = response.status;
          rateLimitWaitMs = parseRateLimitWaitMs(response.headers);
          if (status === 429) {
            rateLimitInfo = formatRateLimitHeaders(response.headers);
          }
          const detail = await response.text().catch(() => '');
          lastError = new Error(
            `Upload failed for ${entry.relPath} (HTTP ${status}): ${detail}`,
          );
        } catch (error) {
          lastError =
            error instanceof Error ? error : new Error(String(error), { cause: error });
        } finally {
          limiter.release();
        }

        const action = match(status)
          .with(400, 401, 403, 404, 422, () => 'abort' as const)
          .with(429, () => 'rate-limit' as const)
          .with(undefined, 408, P.number.gte(500), () => 'retry' as const)
          .otherwise(() => 'abort' as const);

        if (action === 'abort') {
          throw lastError;
        }

        if (action === 'rate-limit') {
          rateLimitAttempts++;
          if (rateLimitAttempts > MAX_RATE_LIMIT_RETRIES) {
            throw lastError;
          }
          retries++;
          rateLimits++;
          const now = Date.now();
          const pauseMs = rateLimitWaitMs ?? Math.min(30_000, 5_000 * rateLimitAttempts);
          const nextCooldownUntil = now + pauseMs;
          // Multiple in-flight workers can hit 429 in the same burst; only step
          // down concurrency and log once per cooldown window.
          if (now >= lastBackoffWindowUntil) {
            lastBackoffWindowUntil = nextCooldownUntil;
            successStreak = 0;
            const nextLimit = limiter.decrease();
            log(
              `netlify-deploy: HTTP 429 at ${uploadedCount}/${toUpload.length} (${rateLimitInfo}) — pausing ${(pauseMs / 1_000).toFixed(1)}s, concurrency -> ${nextLimit}`,
            );
          }
          cooldownUntil = Math.max(cooldownUntil, nextCooldownUntil);
          continue;
        }

        transientAttempts++;
        if (transientAttempts > MAX_UPLOAD_RETRIES) {
          throw lastError;
        }
        retries++;
        await sleepImpl(Math.min(30_000, 500 * 2 ** (transientAttempts - 1)));
      }
    });

    log(
      `netlify-deploy: uploaded ${toUpload.length} files in ${elapsedSec(uploadStart)}s (retries=${retries}, rateLimits=${rateLimits})`,
    );

    const readyStart = performance.now();
    const ready = await pollDeployUntil(
      fetchImpl,
      sleepImpl,
      token,
      siteId,
      deployId,
      new Set(['ready']),
      pollIntervalMs,
      deadlineMs,
    );
    const deployUrl = ready.deploy_ssl_url ?? ready.deploy_url ?? '';
    if (!deployUrl) {
      throw new Error(
        `Netlify deploy ${deployId} reached ready state with no deploy_url`,
      );
    }
    log(
      `netlify-deploy: ready in ${elapsedSec(readyStart)}s (total ${elapsedSec(startedAt)}s) -> ${deployUrl}`,
    );

    return {
      deployId,
      deployUrl,
      totalFiles: entries.length,
      uniqueFiles: bySha.size,
      uploadedFiles: toUpload.length,
      retries,
      rateLimits,
    };
  } catch (error) {
    await cancelDeployBestEffort(fetchImpl, token, deployId);
    throw error;
  }
}

if (process.argv[1] === import.meta.filename) {
  const { values } = parseArgs({
    options: {
      dir: { type: 'string' },
      'site-id': { type: 'string' },
      alias: { type: 'string' },
      message: { type: 'string' },
      token: { type: 'string' },
      concurrency: { type: 'string' },
    },
  });

  const dir = values.dir;
  const siteId = values['site-id'];
  const alias = values.alias;
  const token = values.token ?? process.env.NETLIFY_AUTH_TOKEN;

  if (!dir || !siteId || !alias || !token) {
    console.error(
      'usage: deploy-netlify.ts --dir <path> --site-id <id> --alias <alias> [--message <msg>] [--concurrency <n>] (requires NETLIFY_AUTH_TOKEN)',
    );
    process.exit(2);
  }

  const concurrencyRaw = values.concurrency ?? process.env.NETLIFY_UPLOAD_CONCURRENCY;
  const concurrency = concurrencyRaw ? Number.parseInt(concurrencyRaw, 10) : undefined;
  if (concurrency !== undefined && (!Number.isInteger(concurrency) || concurrency < 1)) {
    console.error(`invalid concurrency: ${concurrencyRaw}`);
    process.exit(2);
  }

  try {
    const result = await deployNetlify({
      dir,
      siteId,
      token,
      alias,
      message: values.message,
      concurrency,
    });
    console.log(
      JSON.stringify({
        deploy_id: result.deployId,
        deploy_url: result.deployUrl,
        total_files: result.totalFiles,
        unique_files: result.uniqueFiles,
        uploaded_files: result.uploadedFiles,
        retries: result.retries,
        rate_limits: result.rateLimits,
      }),
    );
  } catch (error) {
    console.error(
      `deploy-netlify failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}
