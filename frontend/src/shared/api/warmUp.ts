/**
 * Wakes a sleeping backend (free hosting stops it after idle time) as soon as
 * the app opens, so it is already up by the time the user logs in or scans.
 * Fire-and-forget: failures are ignored and it never blocks rendering.
 */
export function warmUpApi(): void {
  const base = import.meta.env.VITE_API_URL as string | undefined;
  if (!base || typeof fetch === "undefined") return;
  void fetch(`${base.replace(/\/+$/, "")}/health`, { method: "GET", cache: "no-store" }).catch(() => undefined);
}
