export const WEAVERS: { name: string; code: string; looms: number; avatar: string }[] = [];

// ─── Weaver Batches (for Receive Sarees) ─────────────────────────────────────
export type SareeStatus = "pending" | "received" | "defective";
// `isRework` marks a saree coming back for the second (or later) time: it was
// semi-approved at QC, sent back to the weaver, and has to be received again.
export interface BatchSaree { no: number; sareeId: string; serial: number; status: SareeStatus; isRework?: boolean; color?: string; weight?: string; warp?: string; resham?: string; jari?: string; }
export interface WeaverBatchData { id: string; total: number; sareeTypeCode: string; bulkOrderLabel?: string; loomNumber?: number; sarees: BatchSaree[]; }
