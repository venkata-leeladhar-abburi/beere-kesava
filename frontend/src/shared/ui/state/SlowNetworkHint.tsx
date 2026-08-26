/**
 * Appears only once a request has been in flight past the slow threshold
 * (requestActivity.ts). Distinguishes "still loading, hang on" from a hung
 * app — without it, a skeleton on a bad connection just looks stuck.
 */
import { Icon } from "../primitives/Icon";
import { useSlowNetwork } from "../../hooks/useSlowNetwork";

export function SlowNetworkHint({ compact = false }: { compact?: boolean }) {
  const isSlow = useSlowNetwork();
  if (!isSlow) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex", alignItems: "center", gap: "var(--space-2)",
        color: "var(--text-tertiary)", fontSize: "13px",
        marginTop: compact ? "var(--space-1)" : "var(--space-3)",
      }}
    >
      <Icon name="spinner" size="sm" className="animate-spin" />
      <span>This is taking longer than usual — still trying…</span>
    </div>
  );
}
