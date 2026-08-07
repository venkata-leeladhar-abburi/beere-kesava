import React from "react";
import { useAuth } from "../../contexts/AuthContext";

// ─── Money visibility ──────────────────────────────────────────────────────
// Some staff accounts are marked `MONEY_HIDDEN` on the `accessLevel` field
// (see backend/prisma/schema.prisma `AccessLevel` enum) so they can use the
// app without seeing financial figures. This is a display-only convenience:
// it hides ₹ amounts in the UI for accounts flagged this way, but the API
// itself still returns the real numbers, so it is NOT a security boundary —
// a MONEY_HIDDEN user could still see raw amounts via the network tab.
// Real enforcement would require stripping amount fields server-side.

/** True when the current user is allowed to see monetary figures. */
export function useMoneyVisible(): boolean {
  const { user } = useAuth();
  return user?.accessLevel !== "MONEY_HIDDEN";
}

interface MoneyValueProps {
  /** Pre-formatted string (e.g. "₹1,23,456") or a raw number to render as-is. */
  value: React.ReactNode;
  /** Shown instead of `value` when the user's accessLevel is MONEY_HIDDEN. Defaults to "—". */
  hiddenText?: string;
  className?: string;
}

/** Renders a money figure, or a placeholder when the viewer's accessLevel is MONEY_HIDDEN. */
export function MoneyValue({ value, hiddenText = "—", className }: MoneyValueProps) {
  const visible = useMoneyVisible();
  return <span className={className}>{visible ? value : hiddenText}</span>;
}
