import { useMemo } from "react";
import { useBatches } from "@/features/production";

// ── Shared saree lookup for the whole Finishing page ─────────────────────────
// The three finishing endpoints each return a thin slice of a saree: the QC
// ready-list has no loom or weight, the assignment list has no factory-loom
// name (so every own-factory saree rendered "—" under Weaver / Loom), and the
// quotation list carries only a type code. All of that already exists on the
// batch row the saree belongs to, so this joins the two by saree id once and
// hands every section the same complete record.

export interface SareeDetail {
  sareeId: string;
  batchId: string | null;
  /** "Ramarao Abburi" or the factory loom's own number — whoever wove it. */
  producerName: string | null;
  /** Human-facing weaver code ("Ramarao-001"); null for a factory loom. */
  weaverCode: string | null;
  /** "Loom 1" for a weaver's own loom, "FACT-LOOM-1" for a factory loom. */
  loomLabel: string | null;
  recipientType: "weaver" | "factoryLoom" | null;
  designCode: string | null;
  sareeTypeCode: string | null;
  sareeTypeName: string | null;
  bulkOrderRef: string | null;
  /** Weight recorded when the saree was received from the weaver, in grams. */
  weightG: number | null;
  color: string | null;
  photoUrl: string | null;
}

function toDetail(batchId: string, r: {
  sareeId: string | null;
  recipientType?: "weaver" | "factoryLoom";
  weaverCode: string | null;
  weaverName: string | null;
  weaverLoom: number | null;
  factoryLoomNumber?: string | null;
  designCode: string | null;
  sareeTypeCode: string | null;
  sareeTypeName: string | null;
  bulkOrderRef: string | null;
  receivedWeight: string | null;
  receivedColor: string | null;
  receivedPhotoUrl: string | null;
}): SareeDetail {
  const weight = r.receivedWeight != null ? Number(r.receivedWeight) : null;
  return {
    sareeId: r.sareeId as string,
    batchId,
    producerName: r.weaverName ?? r.factoryLoomNumber ?? null,
    weaverCode: r.weaverCode,
    loomLabel: r.weaverLoom != null ? `Loom ${r.weaverLoom}` : (r.factoryLoomNumber ?? null),
    recipientType: r.recipientType ?? null,
    designCode: r.designCode,
    sareeTypeCode: r.sareeTypeCode,
    sareeTypeName: r.sareeTypeName,
    bulkOrderRef: r.bulkOrderRef,
    weightG: weight != null && Number.isFinite(weight) ? weight : null,
    color: r.receivedColor,
    photoUrl: r.receivedPhotoUrl,
  };
}

/** saree id → its full batch-row detail. Empty until batches load. */
export function useSareeDetails(): Map<string, SareeDetail> {
  const { batches } = useBatches();
  return useMemo(() => {
    const map = new Map<string, SareeDetail>();
    for (const b of batches) {
      for (const r of b.rows) {
        if (!r.sareeId) continue;
        map.set(r.sareeId, toDetail(b.batchId, r));
      }
    }
    return map;
  }, [batches]);
}

/** First non-empty value that isn't a placeholder dash. */
export function firstReal(...values: (string | null | undefined)[]): string | null {
  for (const v of values) {
    if (v && v !== "—" && v.trim() !== "") return v;
  }
  return null;
}

/** "BS-004 · Bridal Special" — never "BS-004 · BS-004". */
export function sareeTypeLabel(code?: string | null, name?: string | null): string {
  const c = firstReal(code);
  const n = firstReal(name);
  if (c && n && c.toLowerCase() !== n.toLowerCase()) return `${c} · ${n}`;
  return c ?? n ?? "—";
}

export function formatWeight(g: number | null | undefined): string {
  if (g == null || !Number.isFinite(g)) return "—";
  return `${g.toLocaleString("en-IN")} g`;
}

/** Renders any of the date shapes the finishing endpoints return. */
export function formatDate(value?: string | null): string {
  if (!value || value === "—") return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
