/**
 * Subtle connection-state pill for a screen backed by a live socket feed
 * (currently: notifications). Silent by design when connected — a working
 * realtime feed shouldn't nag; it only becomes visible when the user should
 * know their feed isn't live.
 */
import { Icon } from "../primitives/Icon";
import type { SocketStatus } from "../../hooks/useSocketStatus";

const COPY: Record<Exclude<SocketStatus, "connected">, { label: string; icon: "spinner" | "offline" }> = {
  connecting: { label: "Connecting…", icon: "spinner" },
  reconnecting: { label: "Reconnecting…", icon: "spinner" },
  disconnected: { label: "Live updates paused — reconnecting", icon: "offline" },
};

export function SocketStatusBadge({ status }: { status: SocketStatus }) {
  if (status === "connected") return null;

  const { label, icon } = COPY[status];

  return (
    <span
      role="status"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        fontSize: "12px",
        color: "var(--text-tertiary)",
        background: "var(--surface-sunken, rgba(0,0,0,0.04))",
        border: "1px solid var(--border-subtle)",
        borderRadius: "999px",
        padding: "3px 10px",
      }}
    >
      <Icon name={icon} size="sm" className={icon === "spinner" ? "animate-spin" : undefined} />
      {label}
    </span>
  );
}
