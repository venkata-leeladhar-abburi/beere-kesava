import * as Sentry from "@sentry/node";

/**
 * Error tracking. A no-op unless SENTRY_DSN is set, so local dev, tests and
 * any deploy without the variable behave exactly as before.
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  });
}

export function captureServerError(exception: unknown, requestId?: string): void {
  if (!process.env.SENTRY_DSN) return;
  Sentry.withScope((scope) => {
    if (requestId) scope.setTag("request_id", requestId);
    Sentry.captureException(exception);
  });
}
