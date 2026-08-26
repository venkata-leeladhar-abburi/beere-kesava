/**
 * Sticky, non-blocking banner shown while navigator.onLine is false. Does
 * not stop the user interacting with cached data — React Query keeps
 * serving what it already has — it just says why fresh data isn't arriving.
 */
import { Icon } from "../primitives/Icon";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)",
        padding: "var(--space-2) var(--space-4)",
        background: "var(--surface-warning, #fef3c7)", color: "var(--text-warning, #92400e)",
        fontSize: "13px", position: "sticky", top: 0, zIndex: "var(--z-banner, 40)",
      }}
    >
      <Icon name="offline" size="sm" />
      <span>You're offline — showing the last data we had. We'll reconnect automatically.</span>
    </div>
  );
}
