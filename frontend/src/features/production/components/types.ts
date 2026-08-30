export type CodeCallbacks = { onDesignClick?: (code: string) => void; onSareeTypeClick?: (code: string) => void };

export type OrderStatus = "on-track" | "at-risk" | "overdue";

export interface BulkOrder {
  customer: string;
  ref: string;
  due: string;
  status: OrderStatus;
  batches?: string[];
  daysLeft?: number;
  overdueBy?: number;
  sareeType: string;
  design: string;
  done: number;
  total: number;
  shortage?: number;
  instructions?: string;
  linkedBatches?: string[];
  createdDate?: string;
  customerId?: string;
  dispatchStatus?: "pending" | "dispatched" | "invoiced";
  dispatchDate?: string;
  invoiceId?: string;
  paymentStatus?: "pending" | "partial" | "paid";
  amountDue?: number;
  amountPaid?: number;
  photoUrls?: string[];
  notes?: string;
  tallied?: boolean;
  talliedBy?: string;
  talliedDate?: string;
  createdBy?: { id: string; name: string } | null;
}

export type BatchStage = "weaving" | "submitted" | "qc-passed" | "finishing";

export interface WeaverRef { name: string; id: string; initials: string; bg: string }

export interface Batch {
  id: string; stage: BatchStage; sareeCode: string; sareeTypeName: string; rate: number;
  design: string; designName: string; weavers: WeaverRef[];
  materials: string; started: string; expected?: string; submitted?: string;
  done: number; total: number; late?: number; qcPassed?: number; finishingDone?: number; rejected?: number;
  isLive?: boolean; createdBy?: string | null;
}

export type HistoryStatus = "Printing Completed" | "Printing In Process" | "Challenge in Progress";

export interface HistoryBatch {
  /** Row key — unique per (batch, weaver/loom) group, since one batch can list several rows. */
  id: string;
  /** The actual batch number, for display — several rows can share this when a batch has several recipients. */
  batchId: string;
  designCode: string;
  sareeType: string;
  batchSize: number;
  weavers: Array<{ initials: string; bg: string }>;
  completion: number;
  allPieces: number;
  okPieces: number | null;
  found: number | null;
  status: HistoryStatus;
  makingCharges: string;
  completedOn: string;
  bulkOrder?: string;
}
