// The vm pools (vmThreads/vmForks) evaluate test modules inside a happy-dom
// realm that exposes none of Node's globals, but msw instantiates a
// BroadcastChannel at module scope (msw/src/ws/ws.ts) — the whole dom project
// fails at import time without it. Setup files load in order, so this file
// must stay before mswSetup.ts in setupFiles, and import-free so nothing
// evaluates before the global exists. It pulls Node's own implementation so
// msw's websocket manager keeps working if a test ever exercises it.
if (typeof BroadcastChannel === 'undefined') {
  const { BroadcastChannel: nodeBroadcastChannel } =
    process.getBuiltinModule('node:worker_threads');
  // defineProperty instead of a plain assignment: the worker_threads and DOM
  // lib BroadcastChannel types disagree on MessagePort, and this file must
  // typecheck against both realms.
  Object.defineProperty(globalThis, 'BroadcastChannel', {
    value: nodeBroadcastChannel,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}
