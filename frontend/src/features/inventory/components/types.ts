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
  date: string; // qcPassDate or receivedDate
  status: "QC Passed" | "Finishing complete" | "Dispatched" | "Damaged — Review Needed";
  rawType: "readySaree" | "return";
  originalId: string; // readySaree id or return id
  bulkOrderRef?: string;
  batchId?: string;
  quotationRef?: string;
}
