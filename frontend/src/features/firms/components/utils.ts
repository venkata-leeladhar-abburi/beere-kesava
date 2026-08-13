// ─── Firms feature — pure helpers ─────────────────────────────────────────────

import { formatMoney, rupees } from "../../../lib/domain/money";

export function fmtAmt(n: number): string {
  return formatMoney(rupees(n), { compact: true });
}

export function fmtFull(n: number): string {
  return formatMoney(rupees(n));
}

export function initials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// Was `parseInt(id.replace("FIRM-",""), 10) % 5` — only worked for the old
// "FIRM-N" mock ids; real backend ids are UUIDs, so parseInt on those is
// always NaN and the header band silently rendered with no background.
// Hash the whole id instead so it works for any id shape.
export function cardColor(id: string): string {
  const palette = ["#6E0F2D", "#1E6640", "#C89B47", "#4A061B", "#1565C0"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length]!;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
