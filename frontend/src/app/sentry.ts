import * as Sentry from "@sentry/react";

/** Error tracking; a no-op unless VITE_SENTRY_DSN is set at build time. */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0,
  });
}
