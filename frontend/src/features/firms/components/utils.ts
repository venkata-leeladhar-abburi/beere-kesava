// ─── Firms feature — pure helpers ─────────────────────────────────────────────

export function fmtAmt(n: number): string {
  if (n >= 10_00_000) return `₹${(n / 10_00_000).toFixed(2)}L`;
  if (n >= 1_000)     return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function fmtFull(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
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
