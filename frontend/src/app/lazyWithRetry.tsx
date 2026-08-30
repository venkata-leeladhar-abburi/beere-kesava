import { lazy, type ComponentType } from "react";

/**
 * `React.lazy` that survives a failed chunk fetch.
 * ═══════════════════════════════════════════════════════════════════════════
 * A plain `lazy(() => import("./Page"))` caches its rejection forever: once the
 * import fails, React never calls the factory again, so every later render of
 * that route throws the same
 *
 *   TypeError: Failed to fetch dynamically imported module: …/HomePage.tsx
 *
 * straight into the error boundary, and only a manual reload clears it. The
 * browser's own module map behaves the same way — an errored URL is not
 * re-requested, which is why "Try Again" on the error screen never helped.
 *
 * The two ways this happens in practice:
 *   - dev: the Vite server restarts (or a file is renamed) while a tab is open,
 *     so the module graph the tab is holding no longer exists
 *   - prod: a deploy replaces the hashed chunk a loaded tab is still pointing at
 *
 * Both are recovered the same way — retry once for a genuinely transient blip,
 * then reload the document, which is the only thing that clears a poisoned
 * module map. The sessionStorage flag makes that reload happen at most once per
 * tab, so a real, permanent failure surfaces in the error boundary instead of
 * turning into a reload loop.
 */
const RELOAD_FLAG = "bk:chunk-reload";

function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /dynamically imported module|Importing a module script failed|Loading chunk|Failed to fetch/i.test(msg);
}

export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      sessionStorage.removeItem(RELOAD_FLAG);
      return mod;
    } catch (err) {
      if (!isChunkLoadError(err)) throw err;

      // One retry, for the case where the chunk was simply unreachable for a
      // moment (server mid-restart, flaky connection).
      try {
        const mod = await factory();
        sessionStorage.removeItem(RELOAD_FLAG);
        return mod;
      } catch (retryErr) {
        if (sessionStorage.getItem(RELOAD_FLAG)) throw retryErr;
        sessionStorage.setItem(RELOAD_FLAG, "1");
        window.location.reload();
        // Resolve never — the document is being replaced, and throwing here
        // would flash the error boundary on the way out.
        return new Promise<{ default: T }>(() => {});
      }
    }
  });
}
