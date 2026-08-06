export const WEAVERS: { name: string; code: string; looms: number; avatar: string }[] = [];

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

export const WEAVER_BATCHES: Record<string, WeaverBatchData[]> = {};
