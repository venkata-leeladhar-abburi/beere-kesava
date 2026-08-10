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

export function cardColor(id: string): string {
  return ["#6E0F2D","#1E6640","#C89B47","#4A061B","#1565C0"][parseInt(id.replace("FIRM-",""), 10) % 5];
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
