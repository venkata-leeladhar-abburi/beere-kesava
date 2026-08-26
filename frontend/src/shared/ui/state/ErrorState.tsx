/**
 * The default content-region error state. Takes the raw `unknown` a query
 * throws, classifies it via errorMessages.ts, and renders the right copy +
 * retry — callers never write their own "Failed to load…" string.
 */
import { StateView } from "./StateView";
import { copyForError } from "./errorMessages";

export interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({ error, onRetry, compact }: ErrorStateProps) {
  const copy = copyForError(error);

  return (
    <StateView
      role="alert"
      icon="error"
      title={copy.title}
      description={copy.description}
      compact={compact}
      action={copy.retryable && onRetry ? { label: "Retry", onClick: onRetry } : undefined}
    />
  );
}
