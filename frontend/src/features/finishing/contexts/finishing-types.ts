// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReadySaree {
  id: string;
  designCode: string;
  sareeType: string;
  sareeTypeCode?: string;
  weaverName: string;
  weaverId?: string;
  weight?: string;
  bulkOrderRef?: string;
  qcPassDate: string;
  status?: "qc-passed-pending-finishing";
}

export interface FinishingAssignment {
  id: string;
  sareeId: string;
  designCode: string;
  sareeTypeCode?: string;
  sareeType: string;
  weaverName: string;
  qcPassDate: string;
  finishingStaffId: string;
  finishingStaffName: string;
  assignedDate: string;
  assignedBy: string;
  batchId?: string;
  status: "awaiting-return" | "returned";
  quotationRef?: string;
}

export interface FinishingReturn {
  id: string;
  assignmentId: string;
  sareeId: string;
  designCode: string;
  sareeTypeCode?: string;
  sareeType: string;
  weaverName: string;
  condition: "perfect" | "damaged";
  damageType?: string;
  damageSeverity?: "Minor" | "Moderate" | "Severe";
  damageNotes?: string;
  damagePhotoUrl?: string;
  receivedBy: string;
  receivedDate: string;
  inventoryStatus: "Ready for Dispatch" | "Damaged — Review Needed" | "Dispatched";
  dispatchId?: string;
  quotationRef?: string;
}

// ── Quotation (Inventory → Worker finishing → Admin dispatch) ─────────────────
export interface QuotationSaree {
  sareeId: string;
  designCode: string;
  sareeTypeCode?: string;
  sareeType: string;
  weaverName: string;
  finishingStatus: "pending" | "in-finishing" | "received";
  /** Set once this specific saree is assigned — different sarees in the same
   *  quotation can go to different finishing staff across separate assign actions. */
  finishingStaffName?: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  quotationDate: string;
  customerId: string;
  customerName: string;
  customerCity?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerGst?: string;
  bulkOrderRef?: string;
  sarees: QuotationSaree[];
  prices: Record<string, string>;
  applyGst: boolean;
  gstPct: string;
  firmId?: string;
  firmName?: string;
  notes?: string;
  subtotal: number;
  grandTotal: number;
  raisedBy: string;
  status: "raised" | "in-finishing" | "partially-received" | "received" | "dispatched";
  finishingStaffId?: string;
  finishingStaffName?: string;
  assignedDate?: string;
  createdAt: number;
}

export interface DispatchRecord {
  id: string;
  type: "shop" | "wholesale";
  sareeIds: string[];
  dispatchDate: string;
  lrNumber: string;
  transportCompany: string;
  vehicleNumber: string;
  driverName?: string;
  notes?: string;
  // wholesale only
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  expectedDelivery?: string;
  specialInstructions?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  pricePerSaree?: number;
  totalAmount?: number;
  gstPct?: number;
  grandTotal?: number;
  firmId?: string;
  firmName?: string;
  paymentDueDate?: string;
  invoiceNotes?: string;
  bulkOrderRef?: string;
  // Set when the dispatch was raised directly (e.g. from the invoice step or the very
  // first step) and transport / receipt details were skipped to be filled in later.
  pendingTransport?: boolean;
  pendingReceipt?: boolean;
  quotationRef?: string;
}

export interface FinishingContextValue {
  readySarees: ReadySaree[];
  assignments: FinishingAssignment[];
  returns: FinishingReturn[];
  dispatches: DispatchRecord[];
  assignSarees: (sareeIds: string[], staff: { id: string; name: string }, assignedBy: string) => void;
  addReadySaree: (saree: ReadySaree) => void;
  receiveReturn: (params: {
    assignmentId: string;
    sareeId: string;
    condition: "perfect" | "damaged";
    damageType?: string;
    damageSeverity?: "Minor" | "Moderate" | "Severe";
    damageNotes?: string;
    damagePhotoUrl?: string;
    receivedBy: string;
    receivedDate: string;
  }) => void;
  dispatchSarees: (sareeIds: string[], record: Omit<DispatchRecord, "id">) => string;
  updateDispatch: (id: string, patch: Partial<DispatchRecord>) => void;
  quotations: Quotation[];
  raiseQuotation: (q: Omit<Quotation, "id" | "createdAt">) => string;
  assignQuotationFinishing: (quotationId: string, sareeIds: string[], staff: { id: string; name: string }, assignedBy: string) => void;
  receiveQuotationSarees: (quotationId: string, sareeIds: string[], receivedBy: string) => void;
  markQuotationDispatched: (quotationId: string, dispatchId: string) => void;
}
