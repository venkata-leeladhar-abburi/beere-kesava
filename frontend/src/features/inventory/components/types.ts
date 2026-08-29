// ── Shared types ───────────────────────────────────────────────────────────

// ── Transport form (shared between shop + wholesale) ──────────────────────────
export interface TransportData {
  lrNumber: string; transportCompany: string; vehicleNumber: string;
  driverName: string; dispatchDate: string; notes: string;
  expectedDelivery?: string; specialInstructions?: string;
}

// ── Invoice generator (wholesale step 5) ─────────────────────────────────────
export interface InvoiceData {
  invoiceNumber: string; invoiceDate: string;
  prices: Record<string, string>; applyGst: boolean; gstPct: string;
  firmId: string; paymentDueDate: string; invoiceNotes: string;
}

export interface InventoryRecord {
  id: string; // Saree ID
  designCode: string;
  sareeType: string;
  weaverName: string;
  date: string; // qcPassDate, receivedDate, or purchase date
  status: "QC Passed" | "Finishing complete" | "Dispatched" | "Damaged — Review Needed";
  // "external" = a physical piece from an external purchase — it never passes
  // through QC or finishing, so it enters inventory ready for dispatch.
  rawType: "readySaree" | "return" | "external";
  originalId: string; // readySaree id, return id, or purchase id
  bulkOrderRef?: string;
  batchId?: string;
  quotationRef?: string;
  /** Supplier name, for an externally purchased piece. */
  supplier?: string;
}
