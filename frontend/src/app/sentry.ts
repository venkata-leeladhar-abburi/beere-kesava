/**
 * Error tracking; a no-op unless VITE_SENTRY_DSN is set at build time. The SDK
 * is imported dynamically so it never weighs on the initial bundle (or loads at
 * all) when no DSN is configured.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  void import("@sentry/react").then((Sentry) => {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0,
    });
  });
}
