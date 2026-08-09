/**
 * HSN/SAC registry — design-system/07-DOCUMENTS.md Part I.2.
 * ═══════════════════════════════════════════════════════════════════════════
 * A config table, not hardcoded per document — a rate change is a data edit.
 */
export interface HsnEntry {
  code: string;
  description: string;
  /** GST rate as a percentage, e.g. 5 for 5%. */
  ratePct: number;
}

export const HSN_REGISTRY: Record<string, HsnEntry> = {
  "5007": { code: "5007", description: "Woven fabrics of silk / silk waste — sarees", ratePct: 5 },
  "5004": { code: "5004", description: "Silk yarn (not spun from waste)", ratePct: 5 },
  "5005": { code: "5005", description: "Yarn spun from silk waste", ratePct: 5 },
  "5006": { code: "5006", description: "Silk yarn / thread, put up for retail", ratePct: 5 },
  "5605": { code: "5605", description: "Metallised yarn — jari / zari", ratePct: 12 },
  "9988": { code: "9988", description: "Job work — manufacturing services on inputs owned by others", ratePct: 5 },
  "9965": { code: "9965", description: "Goods transport agency services", ratePct: 5 },
};

/** The default HSN for a finished saree line item — silk sarees. */
export const DEFAULT_SAREE_HSN = "5007";

export function hsnRate(code: string): number {
  return HSN_REGISTRY[code]?.ratePct ?? 5;
}

export function hsnDescription(code: string): string {
  return HSN_REGISTRY[code]?.description ?? "";
}
