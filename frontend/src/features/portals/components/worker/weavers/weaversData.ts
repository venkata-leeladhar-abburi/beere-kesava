// ─── Issue Material Page — mock weaver/batch data ────────────────────────────
export const WEAVERS = [
  { name: "Padma Veni", code: "8937070a-ea63-43f3-9cb4-dcbcfd362ff7", looms: 2, avatar: "PV" },
  { name: "Ravi Kumar", code: "b5f9178c-b1b9-4871-a7c3-0d68a462d57a", looms: 3, avatar: "RK" },
  { name: "Suresh Murti", code: "11278a51-a26d-4eaa-adbf-bedbfa7fdf46", looms: 1, avatar: "SM" },
];

// ─── Weaver Batches (for Receive Sarees) ─────────────────────────────────────
export type SareeStatus = "pending" | "received" | "defective";
export interface BatchSaree { no: number; status: SareeStatus; color?: string; weight?: string; warp?: string; resham?: string; jari?: string; }
export interface WeaverBatchData { id: string; total: number; sareeTypeCode: string; bulkOrderLabel?: string; sarees: BatchSaree[]; }

export function makeBatch(id: string, total: number, doneCount: number, sareeTypeCode: string, bulkOrderLabel?: string): WeaverBatchData {
  return {
    id, total, sareeTypeCode, bulkOrderLabel,
    sarees: Array.from({ length: total }, (_, i) => ({
      no: i + 1,
      status: i < doneCount ? "received" as SareeStatus : "pending" as SareeStatus,
      color: i < doneCount ? ["Gold", "Red", "Green"][i % 3] : undefined,
      weight: i < doneCount ? String(820 + i * 12) : undefined,
    })),
  };
}

export const WEAVER_BATCHES: Record<string, WeaverBatchData[]> = {
  "8937070a-ea63-43f3-9cb4-dcbcfd362ff7": [
    makeBatch("BATCH-086", 5, 3, "SB-001", "Lakshmi Silks · ORD-041"),
    makeBatch("BATCH-090", 3, 0, "SB-004"),
  ],
  "b5f9178c-b1b9-4871-a7c3-0d68a462d57a": [
    makeBatch("BATCH-089", 8, 4, "HZ-002"),
    makeBatch("BATCH-095", 4, 0, "HZ-005"),
  ],
  "11278a51-a26d-4eaa-adbf-bedbfa7fdf46": [
    makeBatch("BATCH-081", 4, 2, "GC-003", "Vijaylakshmi Silks · ORD-038"),
    makeBatch("BATCH-084", 2, 0, "GC-006"),
  ],
};
