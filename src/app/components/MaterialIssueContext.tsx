import React, { createContext, useContext, useState, useCallback } from "react";

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface IssuedMaterialItem {
  materialType: "Warp" | "Resham" | "Jari";
  warpSubtype?: "Resham Warp" | "Jari Warp";  // only for Warp type
  description?: string;
  quantity: number;
  unit: string;        // kg for Warp/Resham, Buns/Reels for Jari
  jariType?: "Polyester" | "Silk Fast";
  jariGrade?: "1G" | "2G" | "3G" | "4G" | "5G";
  jariColor?: string;
  grnBatchId: string;  // which received GRN batch this material came from
}

export interface MaterialIssueRecord {
  id: string;               // auto-generated e.g. "MIR-2026-001"
  weaverId?: string;         // set when issued to a weaver
  weaverName?: string;
  loomNumber?: number;      // Loom number selected
  batchId?: string;         // Production batch this issuance is for
  factoryLoomId?: string;   // set instead of weaverId when issued to a factory loom
  factoryLoomNumber?: string;
  issuedBy: string;         // Admin name who issued
  issuedAt: string;         // date-time
  materials: IssuedMaterialItem[];
  signatureMethod: "here" | "remote";
  signatureCaptured: boolean;
  signatureTimestamp?: string;
  notes?: string;
  status: "pending-signature" | "signed" | "cancelled";
}

// ─── Seed data ────────────────────────────────────────────────────────────────
const INITIAL_ISSUE_RECORDS: MaterialIssueRecord[] = [
  {
    id: "MIR-2026-001",
    weaverId: "WV-001",
    weaverName: "Ravi Kumar",
    loomNumber: 2,
    batchId: "BATCH-094",
    issuedBy: "Admin (Kesava Rao)",
    issuedAt: "2026-07-01T09:15:00.000Z",
    materials: [
      { materialType: "Warp", warpSubtype: "Jari Warp", description: "Cotton/Silk blend", quantity: 4.5, unit: "kg", grnBatchId: "GRN-2026-JUN-001" },
      { materialType: "Resham", description: "Red Resham", quantity: 0.8, unit: "kg", grnBatchId: "GRN-2026-JUN-002" },
    ],
    signatureMethod: "here",
    signatureCaptured: true,
    signatureTimestamp: "2026-07-01T09:22:00.000Z",
    notes: "Batch BATCH-094 handover.",
    status: "signed",
  },
  {
    id: "MIR-2026-002",
    weaverId: "WV-002",
    weaverName: "Padma Veni",
    loomNumber: 1,
    batchId: "BATCH-094",
    issuedBy: "Admin (Kesava Rao)",
    issuedAt: "2026-07-02T11:40:00.000Z",
    materials: [
      { materialType: "Jari", jariType: "Polyester", jariGrade: "2G", jariColor: "Gold", quantity: 8, unit: "Reels", grnBatchId: "GRN-2026-JUN-003" },
      { materialType: "Warp", warpSubtype: "Resham Warp", quantity: 3, unit: "kg", grnBatchId: "GRN-2026-JUN-001" },
    ],
    signatureMethod: "remote",
    signatureCaptured: true,
    signatureTimestamp: "2026-07-02T13:05:00.000Z",
    status: "signed",
  },
  {
    id: "MIR-2026-003",
    weaverId: "WV-001",
    weaverName: "Ravi Kumar",
    loomNumber: 2,
    batchId: "BATCH-094",
    issuedBy: "Admin (Kesava Rao)",
    issuedAt: "2026-07-03T10:00:00.000Z",
    materials: [
      { materialType: "Resham", description: "Maroon Resham", quantity: 1.2, unit: "kg", grnBatchId: "GRN-2026-JUN-002" },
      { materialType: "Jari", jariType: "Silk Fast", jariGrade: "1G", jariColor: "Silver", quantity: 2, unit: "Buns", grnBatchId: "GRN-2026-JUN-003" },
    ],
    signatureMethod: "here",
    signatureCaptured: false,
    notes: "Awaiting weaver signature at next visit.",
    status: "pending-signature",
  },
  {
    id: "MIR-2026-004",
    weaverId: "WV-005",
    weaverName: "Anand K.",
    loomNumber: 3,
    batchId: "BATCH-094",
    issuedBy: "Admin (Kesava Rao)",
    issuedAt: "2026-07-03T14:20:00.000Z",
    materials: [
      { materialType: "Warp", description: "Cotton/Silk blend", quantity: 3.6, unit: "kg", grnBatchId: "GRN-2026-JUN-001" },
      { materialType: "Jari", jariType: "Polyester", jariGrade: "2G", jariColor: "Gold", quantity: 5, unit: "Reels", grnBatchId: "GRN-2026-JUN-003" },
    ],
    signatureMethod: "here",
    signatureCaptured: true,
    signatureTimestamp: "2026-07-03T14:28:00.000Z",
    status: "signed",
  },
  {
    id: "MIR-2026-009",
    factoryLoomId: "FL-001",
    factoryLoomNumber: "Loom F-01",
    batchId: "BATCH-090",
    issuedBy: "Admin (Kesava Rao)",
    issuedAt: "2026-06-24T09:15:00.000Z",
    materials: [
      { materialType: "Warp", description: "Cotton/Silk blend", quantity: 6, unit: "kg", grnBatchId: "GRN-2026-JUN-001" },
      { materialType: "Jari", jariType: "Polyester", jariGrade: "2G", jariColor: "Gold", quantity: 8, unit: "Reels", grnBatchId: "GRN-2026-JUN-003" },
    ],
    signatureMethod: "here",
    signatureCaptured: true,
    signatureTimestamp: "2026-06-24T09:25:00.000Z",
    status: "signed",
  },
  {
    id: "MIR-2026-010",
    factoryLoomId: "FL-001",
    factoryLoomNumber: "Loom F-01",
    batchId: "BATCH-088",
    issuedBy: "Admin (Kesava Rao)",
    issuedAt: "2026-06-20T08:30:00.000Z",
    materials: [
      { materialType: "Warp", description: "Pure Silk Warp", quantity: 4.5, unit: "kg", grnBatchId: "GRN-2026-JUN-001" },
      { materialType: "Resham", description: "Red Resham", quantity: 1.2, unit: "kg", grnBatchId: "GRN-2026-JUN-002" },
    ],
    signatureMethod: "here",
    signatureCaptured: true,
    signatureTimestamp: "2026-06-20T08:40:00.000Z",
    status: "signed",
  },
  {
    id: "MIR-2026-005",
    factoryLoomId: "FL-002",
    factoryLoomNumber: "Loom F-02",
    batchId: "BATCH-094",
    issuedBy: "Admin (Kesava Rao)",
    issuedAt: "2026-07-04T10:30:00.000Z",
    materials: [
      { materialType: "Warp", description: "Cotton/Silk blend", quantity: 5, unit: "kg", grnBatchId: "GRN-2026-JUN-001" },
      { materialType: "Resham", description: "Gold Resham", quantity: 1.5, unit: "kg", grnBatchId: "GRN-2026-JUN-002" },
      { materialType: "Jari", jariType: "Polyester", jariGrade: "2G", jariColor: "Gold", quantity: 6, unit: "Reels", grnBatchId: "GRN-2026-JUN-003" },
    ],
    signatureMethod: "here",
    signatureCaptured: true,
    signatureTimestamp: "2026-07-04T10:40:00.000Z",
    status: "signed",
  },
  {
    id: "MIR-2026-006",
    weaverId: "WV-001",
    weaverName: "Ravi Kumar",
    loomNumber: 2,
    batchId: "BATCH-078",
    issuedBy: "Admin (Kesava Rao)",
    issuedAt: "2026-05-10T08:30:00.000Z",
    materials: [
      { materialType: "Warp", description: "Cotton/Silk blend", quantity: 3, unit: "kg", grnBatchId: "GRN-2026-MAY-001" },
      { materialType: "Jari", jariType: "Polyester", jariGrade: "2G", jariColor: "Gold", quantity: 4, unit: "Reels", grnBatchId: "GRN-2026-MAY-002" },
    ],
    signatureMethod: "here",
    signatureCaptured: true,
    signatureTimestamp: "2026-05-10T08:40:00.000Z",
    notes: "Batch BATCH-078 handover.",
    status: "signed",
  },
];

// ─── Material weight conversion ───────────────────────────────────────────────
// One reel of Jari weighs 230 grams; a Bun is 4 reels (see IssueMaterialPage).
export const JARI_REEL_GRAMS = 230;
export const REELS_PER_BUN = 4;

/** Convert a single issued material line into grams. */
export function materialItemToGrams(m: IssuedMaterialItem): number {
  const qty = m.quantity || 0;
  if (m.materialType === "Jari") {
    const unit = (m.unit || "").toLowerCase();
    if (unit.startsWith("bun")) return qty * REELS_PER_BUN * JARI_REEL_GRAMS;
    // default: Reels
    return qty * JARI_REEL_GRAMS;
  }
  // Warp / Resham are weight-based
  const unit = (m.unit || "").toLowerCase();
  if (unit === "g" || unit === "gram" || unit === "grams") return qty;
  return qty * 1000; // kg → g
}

// ─── Received sarees (returned by weaver, weighed by worker staff) ─────────────
export interface ReceivedSareeRecord {
  id: string;          // Saree ID e.g. "RAVI-L2-004"
  weaverId: string;
  batchId?: string;
  weightGrams: number; // weight entered by worker staff at receipt
  receivedAt: string;  // ISO date-time
  color?: string;
  status: "received" | "defective";
}

// Seed received sarees so outstanding material is meaningful in the demo.
const INITIAL_RECEIVED_SAREES: ReceivedSareeRecord[] = [
  { id: "RAVI-L2-001",  weaverId: "WV-001", batchId: "BATCH-094", weightGrams: 842, receivedAt: "2026-07-05T10:00:00.000Z", color: "Gold",  status: "received" },
  { id: "RAVI-L2-002",  weaverId: "WV-001", batchId: "BATCH-094", weightGrams: 918, receivedAt: "2026-07-06T10:00:00.000Z", color: "Maroon", status: "received" },
  { id: "PADMA-L1-001", weaverId: "WV-002", batchId: "BATCH-094", weightGrams: 856, receivedAt: "2026-07-05T11:00:00.000Z", color: "Red",   status: "received" },
  { id: "ANAND-L3-001", weaverId: "WV-005", batchId: "BATCH-094", weightGrams: 774, receivedAt: "2026-07-06T09:00:00.000Z", color: "Cream", status: "received" },
];

// ─── Outstanding material summary ─────────────────────────────────────────────
export interface WeaverMaterialSummary {
  issuedGrams: number;       // total material given (in grams)
  receivedGrams: number;     // total weight of sarees returned & weighed
  outstandingGrams: number;  // still lying with the weaver (issued − received)
  jariReels: number;         // total jari issued expressed in reels
  sareesReceived: number;    // count of sarees returned
}

export interface BatchMaterialSummary extends WeaverMaterialSummary {
  batchId: string;           // production batch this material relates to
}

// Compute a summary from a set of issue records + received sarees.
function summarize(records: MaterialIssueRecord[], received: ReceivedSareeRecord[]): WeaverMaterialSummary {
  let issuedGrams = 0;
  let jariReels = 0;
  records.forEach(r => r.materials.forEach(m => {
    issuedGrams += materialItemToGrams(m);
    if (m.materialType === "Jari") {
      jariReels += (m.unit || "").toLowerCase().startsWith("bun")
        ? (m.quantity || 0) * REELS_PER_BUN
        : (m.quantity || 0);
    }
  }));
  const receivedGrams = received.reduce((sum, r) => sum + (r.weightGrams || 0), 0);
  return {
    issuedGrams,
    receivedGrams,
    outstandingGrams: issuedGrams - receivedGrams,
    jariReels,
    sareesReceived: received.length,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface MaterialIssueContextValue {
  issueRecords: MaterialIssueRecord[];
  receivedSarees: ReceivedSareeRecord[];
  addIssueRecord: (record: Omit<MaterialIssueRecord, "id">) => MaterialIssueRecord;
  addReceivedSaree: (rec: ReceivedSareeRecord) => void;
  getRecordsForWeaver: (weaverId: string) => MaterialIssueRecord[];
  getReceivedForWeaver: (weaverId: string) => ReceivedSareeRecord[];
  getMaterialSummaryForWeaver: (weaverId: string) => WeaverMaterialSummary;
  getMaterialSummaryByBatch: (weaverId: string) => BatchMaterialSummary[];
  updateSignatureStatus: (recordId: string, method: "here" | "remote") => void;
}

const MaterialIssueContext = createContext<MaterialIssueContextValue | null>(null);

export function MaterialIssueProvider({ children }: { children: React.ReactNode }) {
  const [issueRecords, setIssueRecords] = useState<MaterialIssueRecord[]>(INITIAL_ISSUE_RECORDS);
  const [receivedSarees, setReceivedSarees] = useState<ReceivedSareeRecord[]>(INITIAL_RECEIVED_SAREES);

  // Compute next MIR number
  const allNums = issueRecords
    .map(r => {
      const m = r.id.match(/MIR-\d{4}-(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter(n => n > 0);
  const maxNum = allNums.length > 0 ? Math.max(...allNums) : 3;
  const nextId = `MIR-2026-${String(maxNum + 1).padStart(3, "0")}`;

  const addIssueRecord = useCallback((record: Omit<MaterialIssueRecord, "id">) => {
    const newRecord: MaterialIssueRecord = { ...record, id: nextId };
    setIssueRecords(prev => [newRecord, ...prev]);
    return newRecord;
  }, [nextId]);

  const getRecordsForWeaver = useCallback((weaverId: string) => {
    return issueRecords.filter(r => r.weaverId === weaverId);
  }, [issueRecords]);

  const addReceivedSaree = useCallback((rec: ReceivedSareeRecord) => {
    setReceivedSarees(prev => [rec, ...prev]);
  }, []);

  const getReceivedForWeaver = useCallback((weaverId: string) => {
    return receivedSarees.filter(r => r.weaverId === weaverId);
  }, [receivedSarees]);

  const getMaterialSummaryForWeaver = useCallback((weaverId: string): WeaverMaterialSummary => {
    return summarize(
      issueRecords.filter(r => r.weaverId === weaverId),
      receivedSarees.filter(r => r.weaverId === weaverId),
    );
  }, [issueRecords, receivedSarees]);

  const getMaterialSummaryByBatch = useCallback((weaverId: string): BatchMaterialSummary[] => {
    const records = issueRecords.filter(r => r.weaverId === weaverId);
    const received = receivedSarees.filter(r => r.weaverId === weaverId);
    // Every batch that appears in either issued material or returned sarees.
    const batchIds = Array.from(new Set([
      ...records.map(r => r.batchId || "Unassigned"),
      ...received.map(r => r.batchId || "Unassigned"),
    ]));
    return batchIds
      .map(batchId => ({
        batchId,
        ...summarize(
          records.filter(r => (r.batchId || "Unassigned") === batchId),
          received.filter(r => (r.batchId || "Unassigned") === batchId),
        ),
      }))
      // Show batches with the most material still outstanding first.
      .sort((a, b) => b.outstandingGrams - a.outstandingGrams);
  }, [issueRecords, receivedSarees]);

  const updateSignatureStatus = useCallback((recordId: string, method: "here" | "remote") => {
    setIssueRecords(prev =>
      prev.map(r =>
        r.id === recordId
          ? { ...r, signatureMethod: method, signatureCaptured: true, signatureTimestamp: new Date().toISOString(), status: "signed" as const }
          : r
      )
    );
  }, []);

  return (
    <MaterialIssueContext.Provider value={{ issueRecords, receivedSarees, addIssueRecord, addReceivedSaree, getRecordsForWeaver, getReceivedForWeaver, getMaterialSummaryForWeaver, getMaterialSummaryByBatch, updateSignatureStatus }}>
      {children}
    </MaterialIssueContext.Provider>
  );
}

export function useMaterialIssue(): MaterialIssueContextValue {
  const ctx = useContext(MaterialIssueContext);
  if (!ctx) throw new Error("useMaterialIssue must be used inside MaterialIssueProvider");
  return ctx;
}
