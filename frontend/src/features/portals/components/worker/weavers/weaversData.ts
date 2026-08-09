export const WEAVERS: { name: string; code: string; looms: number; avatar: string }[] = [];

// ─── Weaver Batches (for Receive Sarees) ─────────────────────────────────────
export type SareeStatus = "pending" | "received" | "defective";
export interface BatchSaree { no: number; sareeId: string; serial: number; status: SareeStatus; color?: string; weight?: string; warp?: string; resham?: string; jari?: string; }
export interface WeaverBatchData { id: string; total: number; sareeTypeCode: string; bulkOrderLabel?: string; sarees: BatchSaree[]; }
