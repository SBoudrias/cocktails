import { http, HttpResponse, type JsonBodyType } from 'msw';
import { setupServer } from 'msw/node';

/**
 * The msw server for tests that fetch the app's shared JSON resources (the
 * search index, the recipe catalog). Tests register handlers on it directly;
 * each test file wires `beforeAll(listen) / afterAll(close) /
 * afterEach(resetHandlers)` and resets the loader modules' session caches.
 *
 * vitest.setup.ts keeps a global fetch-rejecting stub: tests that never
 * touch the network stay hermetic without seeing msw's interceptor.
 */
export const sharedJsonServer = setupServer();

/**
 * Match a shared resource under the app's base path, at any origin — node-env
 * tests stub a fake origin, happy-dom its own.
 *
 *   http.get(sharedJsonUrl('/data/catalog.json'), handler)
 */
export function sharedJsonUrl(path: string): RegExp {
  const escaped = `/cocktails${path}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`${escaped}$`);
}

/** An ok JSON handler for a shared resource. */
export function serveJson(path: string, body: JsonBodyType) {
  return http.get(sharedJsonUrl(path), () => HttpResponse.json(body));
}

/** A failing handler for a shared resource (HTTP error status). */
export function failJson(path: string, status: number) {
  return http.get(sharedJsonUrl(path), () => new HttpResponse('nope', { status }));
}

/** A handler whose fetch never settles, for loading-state tests. */
export function hangJson(path: string) {
  return http.get(sharedJsonUrl(path), () => new Promise<Response>(() => {}));
}
