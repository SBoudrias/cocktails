#!/usr/bin/env -S node --no-warnings

/**
 * Direct Netlify REST API uploader for PR preview deploys.
 *
 * Replaces `npx netlify-cli deploy` in `.github/workflows/preview.yml`:
 * - avoids the ~22s cold `npx netlify-cli` download on every run
 * - uses Netlify's single-request ZIP deploy API when the file count is
 *   under Netlify's 25,000-file ZIP extraction cap (one HTTP POST instead
 *   of ~19,000 individual file PUTs — cutting deploys from ~7–8 min to
 *   under a minute)
 * - automatically falls back to Netlify's File Digest API (concurrent
 *   uploads, SHA-1 deduplication, and `X-RateLimit-Reset` / `Retry-After`
 *   pacing) if the export exceeds the ZIP cap or `--mode digest` is requested
 *
 * Usage:
 *   node apps/web/tools/deploy-netlify.ts \
 *     --dir apps/web/deploy \
 *     --site-id "$SITE_ID" \
 *     --alias "deploy-preview-123" \
 *     --message "PR #123 @ <sha>"
 *
 * Reads NETLIFY_AUTH_TOKEN from the environment (or --token).
 * Prints `{ deploy_id, deploy_url, method, ... }` JSON to stdout.
 */
import { execFile as execFileCb } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseArgs, promisify } from 'node:util';
import { match, P } from 'ts-pattern';

const execFile = promisify(execFileCb);

const API_BASE = 'https://api.netlify.com/api/v1';
// Netlify caps ZIP extraction at 25,000 files per deploy; leave headroom
// before falling back to the File Digest API.
const MAX_ZIP_FILES = 24_800;
const DEFAULT_DIGEST_CONCURRENCY = 10;
const DEFAULT_HASH_CONCURRENCY = 64;
const DEFAULT_POLL_INTERVAL_MS = 1_500;
const DEFAULT_TIMEOUT_MS = 12 * 60 * 1_000;
const REQUEST_TIMEOUT_MS = 60_000;
const ZIP_UPLOAD_TIMEOUT_MS = 180_000;
const SYNC_FILE_LIMIT = 100;
const MAX_UPLOAD_RETRIES = 6;
const MAX_RATE_LIMIT_RETRIES = 20;

const DIFFED_STATES = new Set(['prepared', 'uploading', 'uploaded', 'ready']);

export type DeployMode = 'auto' | 'zip' | 'digest';

export interface DeployNetlifyOptions {
  dir: string;
  siteId: string;
  token: string;
  alias: string;
  message?: string;
  mode?: DeployMode;
  concurrency?: number;
  pollIntervalMs?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  sleepImpl?: (ms: number) => Promise<void>;
  createZipImpl?: (dir: string) => Promise<Buffer>;
  log?: (line: string) => void;
}

export interface DeployNetlifyResult {
  deployId: string;
  deployUrl: string;
  method: 'zip' | 'digest';
  totalFiles: number;
  uniqueFiles?: number;
  uploadedFiles?: number;
  zipBytes?: number;
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
    const resetEpochSec = Number(resetHeader);
    if (Number.isFinite(resetEpochSec) && resetEpochSec > 0) {
      return Math.max(1_000, Math.ceil(resetEpochSec * 1_000 - nowMs) + 250);
    }
  }
  const retryAfter = headers.get('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.max(1_000, Math.ceil(seconds * 1_000));
    }
    const dateMs = Date.parse(retryAfter);
    if (Number.isFinite(dateMs)) {
      return Math.max(1_000, dateMs - nowMs);
    }
  }
  return null;
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

async function defaultCreateZip(rootDir: string): Promise<Buffer> {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'netlify-zip-'));
  const zipPath = path.join(tempDir, 'deploy.zip');
  try {
    // Compression level 1 is fast on ~24k small HTML/RSC files while still
    // shrinking the ~570 MB export to ~130 MB for a quick single POST.
    await execFile('zip', ['-1', '-q', '-r', zipPath, '.'], {
      cwd: rootDir,
      maxBuffer: 10 * 1024 * 1024,
    });
    return await readFile(zipPath);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function apiRequest(
  fetchImpl: typeof fetch,
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
  };
  if (init.contentType) {
    headers['Content-Type'] = init.contentType;
  }
  const response = await fetchImpl(url, {
    method: init.method,
    body: init.body,
    signal: AbortSignal.timeout(init.timeoutMs ?? REQUEST_TIMEOUT_MS),
    headers,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `Netlify API ${init.method} ${url} failed (${response.status}): ${text}`,
    );
  }
  return text ? JSON.parse(text) : undefined;
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
      await apiRequest(fetchImpl, url, token, { method: 'GET' }),
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
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}

async function deployViaZip(
  absoluteRoot: string,
  totalFiles: number,
  options: Required<
    Pick<
      DeployNetlifyOptions,
      'siteId' | 'token' | 'alias' | 'pollIntervalMs' | 'fetchImpl' | 'sleepImpl' | 'log'
    >
  > & {
    message?: string;
    createZipImpl: (dir: string) => Promise<Buffer>;
    startedAt: number;
    deadlineMs: number;
  },
): Promise<DeployNetlifyResult> {
  const {
    siteId,
    token,
    alias,
    message,
    pollIntervalMs,
    fetchImpl,
    sleepImpl,
    createZipImpl,
    log,
    startedAt,
    deadlineMs,
  } = options;
  const elapsedSec = (since: number) => ((performance.now() - since) / 1_000).toFixed(1);

  const zipStart = performance.now();
  const zipBuffer = await createZipImpl(absoluteRoot);
  log(
    `netlify-deploy: zipped ${totalFiles} files (${(zipBuffer.byteLength / 1024 / 1024).toFixed(1)} MB) in ${elapsedSec(zipStart)}s`,
  );

  const createUrl = new URL(`${API_BASE}/sites/${encodeURIComponent(siteId)}/deploys`);
  createUrl.searchParams.set('branch', alias);
  if (message) {
    createUrl.searchParams.set('title', message);
  }

  const uploadStart = performance.now();
  const created = parseDeployResponse(
    await apiRequest(fetchImpl, createUrl.href, token, {
      method: 'POST',
      contentType: 'application/zip',
      body: new Uint8Array(zipBuffer),
      timeoutMs: ZIP_UPLOAD_TIMEOUT_MS,
    }),
  );
  const deployId = created.id;
  log(
    `netlify-deploy: uploaded zip in ${elapsedSec(uploadStart)}s (deploy=${deployId}, state=${created.state}, branch=${created.branch ?? 'none'}, context=${created.context ?? 'none'})`,
  );

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

    const readyStart = performance.now();
    const ready =
      created.state === 'ready'
        ? created
        : await pollDeployUntil(
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
      method: 'zip',
      totalFiles,
      zipBytes: zipBuffer.byteLength,
      retries: 0,
      rateLimits: 0,
    };
  } catch (error) {
    await cancelDeployBestEffort(fetchImpl, token, deployId);
    throw error;
  }
}

async function deployViaDigest(
  absoluteRoot: string,
  fullPaths: readonly string[],
  options: Required<
    Pick<
      DeployNetlifyOptions,
      | 'siteId'
      | 'token'
      | 'alias'
      | 'concurrency'
      | 'pollIntervalMs'
      | 'fetchImpl'
      | 'sleepImpl'
      | 'log'
    >
  > & {
    message?: string;
    startedAt: number;
    deadlineMs: number;
  },
): Promise<DeployNetlifyResult> {
  const {
    siteId,
    token,
    alias,
    message,
    concurrency,
    pollIntervalMs,
    fetchImpl,
    sleepImpl,
    log,
    startedAt,
    deadlineMs,
  } = options;
  const elapsedSec = (since: number) => ((performance.now() - since) / 1_000).toFixed(1);

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
    await apiRequest(fetchImpl, createUrl.href, token, {
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
      `netlify-deploy: diffed in ${elapsedSec(diffStart)}s — ${toUpload.length} files to upload (concurrency=${concurrency})`,
    );

    const uploadStart = performance.now();
    let uploadedCount = 0;
    let retries = 0;
    let rateLimits = 0;
    let cooldownUntil = 0;

    await mapWithConcurrency(toUpload, concurrency, async (entry) => {
      const fileUrl = `${API_BASE}/deploys/${encodeURIComponent(deployId)}/files/${encodeDeployPath(entry.relPath)}`;
      const body = await readFile(entry.fullPath);

      let transientAttempts = 0;
      let rateLimitAttempts = 0;

      while (true) {
        const waitMs = cooldownUntil - Date.now();
        if (waitMs > 0) {
          await sleepImpl(waitMs);
        }

        let status: number | undefined;
        let rateLimitWaitMs: number | null = null;
        let lastError: Error;

        try {
          const response = await fetchImpl(fileUrl, {
            method: 'PUT',
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/octet-stream',
            },
            body,
          });
          if (response.ok) {
            uploadedCount++;
            if (uploadedCount % 2_000 === 0 || uploadedCount === toUpload.length) {
              log(
                `netlify-deploy: uploaded ${uploadedCount}/${toUpload.length} (${elapsedSec(uploadStart)}s)`,
              );
            }
            return;
          }
          status = response.status;
          rateLimitWaitMs = parseRateLimitWaitMs(response.headers);
          const detail = await response.text().catch(() => '');
          lastError = new Error(
            `Upload failed for ${entry.relPath} (HTTP ${status}): ${detail}`,
          );
        } catch (error) {
          lastError =
            error instanceof Error ? error : new Error(String(error), { cause: error });
        }

        const action = match(status)
          .with(400, 422, () => 'abort' as const)
          .with(429, () => 'rate-limit' as const)
          .with(undefined, P.number.gt(400), () => 'retry' as const)
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
          const pauseMs = rateLimitWaitMs ?? Math.min(30_000, 5_000 * rateLimitAttempts);
          cooldownUntil = Math.max(cooldownUntil, Date.now() + pauseMs);
          await sleepImpl(pauseMs);
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
      method: 'digest',
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

/**
 * Deploy a static directory to Netlify as a named alias deploy via the
 * ZIP API (when under Netlify's 25k-file cap) or the File Digest API.
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
    mode = 'auto',
    concurrency = DEFAULT_DIGEST_CONCURRENCY,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fetchImpl = fetch,
    sleepImpl = defaultSleep,
    createZipImpl = defaultCreateZip,
    log = (line: string) => console.error(line),
  } = options;

  const startedAt = performance.now();
  const deadlineMs = Date.now() + timeoutMs;
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

  const useZip = match(mode)
    .with('zip', () => true)
    .with('digest', () => false)
    .with('auto', () => fullPaths.length <= MAX_ZIP_FILES)
    .exhaustive();

  if (useZip) {
    return deployViaZip(absoluteRoot, fullPaths.length, {
      siteId,
      token,
      alias,
      message,
      pollIntervalMs,
      fetchImpl,
      sleepImpl,
      createZipImpl,
      log,
      startedAt,
      deadlineMs,
    });
  }

  if (mode === 'auto') {
    log(
      `netlify-deploy: ${fullPaths.length} files exceeds ZIP cap (${MAX_ZIP_FILES}); using File Digest API`,
    );
  }

  return deployViaDigest(absoluteRoot, fullPaths, {
    siteId,
    token,
    alias,
    message,
    concurrency,
    pollIntervalMs,
    fetchImpl,
    sleepImpl,
    log,
    startedAt,
    deadlineMs,
  });
}

if (process.argv[1] === import.meta.filename) {
  const { values } = parseArgs({
    options: {
      dir: { type: 'string' },
      'site-id': { type: 'string' },
      alias: { type: 'string' },
      message: { type: 'string' },
      token: { type: 'string' },
      mode: { type: 'string' },
      concurrency: { type: 'string' },
    },
  });

  const dir = values.dir;
  const siteId = values['site-id'];
  const alias = values.alias;
  const token = values.token ?? process.env.NETLIFY_AUTH_TOKEN;

  if (!dir || !siteId || !alias || !token) {
    console.error(
      'usage: deploy-netlify.ts --dir <path> --site-id <id> --alias <alias> [--message <msg>] [--mode auto|zip|digest] [--concurrency <n>] (requires NETLIFY_AUTH_TOKEN)',
    );
    process.exit(2);
  }

  const modeRaw = values.mode ?? 'auto';
  if (modeRaw !== 'auto' && modeRaw !== 'zip' && modeRaw !== 'digest') {
    console.error(`invalid mode: ${modeRaw} (expected auto, zip, or digest)`);
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
      mode: modeRaw,
      concurrency,
    });
    console.log(
      JSON.stringify({
        deploy_id: result.deployId,
        deploy_url: result.deployUrl,
        method: result.method,
        total_files: result.totalFiles,
        unique_files: result.uniqueFiles,
        uploaded_files: result.uploadedFiles,
        zip_bytes: result.zipBytes,
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
