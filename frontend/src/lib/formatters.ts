/**
 * Beere Kesava ERP — Shared Formatters
 * Pure utility functions — no React dependencies.
 */

// ── Currency ───────────────────────────────────────────────────────────────────
export function formatINR(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 10_00_000) return `₹${(amount / 10_00_000).toFixed(2)}L`;
    if (amount >= 1_00_000)  return `₹${(amount / 1_00_000).toFixed(1)}L`;
    if (amount >= 1_000)     return `₹${(amount / 1_000).toFixed(1)}K`;
    return `₹${amount}`;
  }
  return new Intl.NumberFormat("en-IN", {
    style:    "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatINRDecimal(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style:                  "currency",
    currency:               "INR",
    minimumFractionDigits:  2,
    maximumFractionDigits:  2,
  }).format(amount);
}

// ── Date & Time ────────────────────────────────────────────────────────────────
export function formatDate(date: Date | string, style: "short" | "medium" | "long" = "medium"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (style === "short")  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  if (style === "long")   return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-IN", {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d   = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin  = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMs / 3_600_000);
  const diffDay  = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1)    return "Just now";
  if (diffMin < 60)   return `${diffMin}m ago`;
  if (diffHour < 24)  return `${diffHour}h ago`;
  if (diffDay < 7)    return `${diffDay}d ago`;
  return formatDate(d, "short");
}

// ── Weight / Quantity ──────────────────────────────────────────────────────────
export function formatGrams(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(2)} kg`;
  return `${grams} g`;
}

export function formatMeters(meters: number): string {
  return `${meters.toFixed(1)} m`;
}

// ── Percentage ────────────────────────────────────────────────────────────────
export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ── Ordinal ───────────────────────────────────────────────────────────────────
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}
