import React, { createContext, useContext, useState, useCallback } from "react";

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface SareeRow {
  serial: number;
  sareeId: string | null;        // null until weaver or factory loom is assigned
  recipientType?: "weaver" | "factoryLoom";
  weaverId: string | null;
  weaverName: string | null;
  weaverInitials: string | null;
  weaverLoom: number | null;     // which of the weaver's own looms (1..weaver's loom count)
  factoryLoomId?: string | null;      // set when recipientType === "factoryLoom"
  factoryLoomNumber?: string | null;  // e.g. "Loom F-02"
  designCode: string | null;
  sareeTypeCode: string | null;
  sareeTypeName: string | null;
  bulkOrderRef: string | null;   // null = General Stock
  bulkOrderLabel: string | null;
  qcPassed?: boolean;            // true once Worker Staff confirms QC passed for this saree
}

export interface BatchRecord {
  batchId: string;
  totalCount: number;
  dueDate: string;
  rows: SareeRow[];
  status: "draft" | "active" | "completed";
  createdAt: string;
  updatedAt: string;
}

// ─── Saree ID generation ──────────────────────────────────────────────────────
// Format: {FIRSTNAME_UPPER}-L{LOOM}-{SEQ_3DIGIT}  e.g. RAVI-L2-001
export function generateSareeId(weaverName: string, loom: number, seq: number): string {
  const first = weaverName.split(/[\s.]+/)[0].toUpperCase();
  return `${first}-L${loom}-${String(seq).padStart(3, "0")}`;
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface BatchContextValue {
  batches: BatchRecord[];
  saveDraft: (batch: BatchRecord) => void;
  updateBatch: (batchId: string, patch: Partial<BatchRecord>) => void;
  finalizeBatch: (batchId: string) => void;
  nextBatchId: string;
  // Cross-page navigation: set to open a specific batch in BatchCreationPage
  pendingOpenBatchId: string | null;
  setPendingOpenBatchId: (id: string | null) => void;
}

const BatchContext = createContext<BatchContextValue | null>(null);

const INITIAL_BATCHES: BatchRecord[] = [
  {
    batchId: "BATCH-094",
    totalCount: 10,
    dueDate: "2026-07-20",
    status: "active",
    createdAt: "2026-06-28T08:00:00.000Z",
    updatedAt: "2026-06-28T08:00:00.000Z",
    rows: [
      { serial: 1,  sareeId: "RAVI-L2-001",  weaverId: "WV-001", weaverName: "Ravi Kumar",   weaverInitials: "RK", weaverLoom: 2, designCode: "BKB-045", sareeTypeCode: "SB-001", sareeTypeName: "Self Brocade",   bulkOrderRef: "ORD-2026-041", bulkOrderLabel: "Lakshmi Silks · ORD-041", qcPassed: true },
      { serial: 2,  sareeId: "RAVI-L2-002",  weaverId: "WV-001", weaverName: "Ravi Kumar",   weaverInitials: "RK", weaverLoom: 2, designCode: "BKB-045", sareeTypeCode: "SB-001", sareeTypeName: "Self Brocade",   bulkOrderRef: "ORD-2026-041", bulkOrderLabel: "Lakshmi Silks · ORD-041", qcPassed: true },
      { serial: 3,  sareeId: "RAVI-L2-003",  weaverId: "WV-001", weaverName: "Ravi Kumar",   weaverInitials: "RK", weaverLoom: 2, designCode: "BKB-045", sareeTypeCode: "SB-001", sareeTypeName: "Self Brocade",   bulkOrderRef: "ORD-2026-041", bulkOrderLabel: "Lakshmi Silks · ORD-041", qcPassed: false },
      { serial: 4,  sareeId: "PADMA-L1-001", weaverId: "WV-002", weaverName: "Padma Veni",   weaverInitials: "PV", weaverLoom: 1, designCode: "BKB-045", sareeTypeCode: "SB-001", sareeTypeName: "Self Brocade",   bulkOrderRef: "ORD-2026-041", bulkOrderLabel: "Lakshmi Silks · ORD-041" },
      { serial: 5,  sareeId: "PADMA-L1-002", weaverId: "WV-002", weaverName: "Padma Veni",   weaverInitials: "PV", weaverLoom: 1, designCode: "BKB-045", sareeTypeCode: "SB-001", sareeTypeName: "Self Brocade",   bulkOrderRef: "ORD-2026-041", bulkOrderLabel: "Lakshmi Silks · ORD-041" },
      { serial: 6,  sareeId: "ANAND-L3-001", weaverId: "WV-005", weaverName: "Anand K.",     weaverInitials: "AK", weaverLoom: 3, designCode: "BKB-045", sareeTypeCode: "SB-001", sareeTypeName: "Self Brocade",   bulkOrderRef: null, bulkOrderLabel: null },
      { serial: 7,  sareeId: "ANAND-L3-002", weaverId: "WV-005", weaverName: "Anand K.",     weaverInitials: "AK", weaverLoom: 3, designCode: "BKB-045", sareeTypeCode: "SB-001", sareeTypeName: "Self Brocade",   bulkOrderRef: null, bulkOrderLabel: null },
      { serial: 8,  sareeId: "ANAND-L3-003", weaverId: "WV-005", weaverName: "Anand K.",     weaverInitials: "AK", weaverLoom: 3, designCode: "BKB-045", sareeTypeCode: "SB-001", sareeTypeName: "Self Brocade",   bulkOrderRef: null, bulkOrderLabel: null },
      { serial: 9,  sareeId: "MEENA-L4-001", weaverId: "WV-012", weaverName: "Meena R.",     weaverInitials: "MR", weaverLoom: 4, designCode: "BKB-045", sareeTypeCode: "SB-001", sareeTypeName: "Self Brocade",   bulkOrderRef: null, bulkOrderLabel: null },
      { serial: 10, sareeId: "MEENA-L4-002", weaverId: "WV-012", weaverName: "Meena R.",     weaverInitials: "MR", weaverLoom: 4, designCode: "BKB-045", sareeTypeCode: "SB-001", sareeTypeName: "Self Brocade",   bulkOrderRef: null, bulkOrderLabel: null },
    ],
  },
  {
    batchId: "BATCH-093",
    totalCount: 8,
    dueDate: "2026-07-15",
    status: "active",
    createdAt: "2026-06-25T09:30:00.000Z",
    updatedAt: "2026-06-25T09:30:00.000Z",
    rows: [
      { serial: 1, sareeId: "SURESH-L2-001", weaverId: "WV-007", weaverName: "Suresh Murti", weaverInitials: "SM", weaverLoom: 2, designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeTypeName: "Heavy Zari",     bulkOrderRef: "ORD-2026-038", bulkOrderLabel: "Padmavathi Textiles · ORD-038" },
      { serial: 2, sareeId: "SURESH-L2-002", weaverId: "WV-007", weaverName: "Suresh Murti", weaverInitials: "SM", weaverLoom: 2, designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeTypeName: "Heavy Zari",     bulkOrderRef: "ORD-2026-038", bulkOrderLabel: "Padmavathi Textiles · ORD-038" },
      { serial: 3, sareeId: "SURESH-L2-003", weaverId: "WV-007", weaverName: "Suresh Murti", weaverInitials: "SM", weaverLoom: 2, designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeTypeName: "Heavy Zari",     bulkOrderRef: "ORD-2026-038", bulkOrderLabel: "Padmavathi Textiles · ORD-038" },
      { serial: 4, sareeId: "SURESH-L2-004", weaverId: "WV-007", weaverName: "Suresh Murti", weaverInitials: "SM", weaverLoom: 2, designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeTypeName: "Heavy Zari",     bulkOrderRef: "ORD-2026-038", bulkOrderLabel: "Padmavathi Textiles · ORD-038" },
      { serial: 5, sareeId: "KAMALA-L1-001", weaverId: "WV-031", weaverName: "Kamala B.",    weaverInitials: "KB", weaverLoom: 1, designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeTypeName: "Heavy Zari",     bulkOrderRef: "ORD-2026-038", bulkOrderLabel: "Padmavathi Textiles · ORD-038" },
      { serial: 6, sareeId: "KAMALA-L1-002", weaverId: "WV-031", weaverName: "Kamala B.",    weaverInitials: "KB", weaverLoom: 1, designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeTypeName: "Heavy Zari",     bulkOrderRef: null, bulkOrderLabel: null },
      { serial: 7, sareeId: "VENKAT-L3-001", weaverId: "WV-024", weaverName: "Venkat Rao",   weaverInitials: "VR", weaverLoom: 3, designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeTypeName: "Heavy Zari",     bulkOrderRef: null, bulkOrderLabel: null },
      { serial: 8, sareeId: "VENKAT-L3-002", weaverId: "WV-024", weaverName: "Venkat Rao",   weaverInitials: "VR", weaverLoom: 3, designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeTypeName: "Heavy Zari",     bulkOrderRef: null, bulkOrderLabel: null },
    ],
  },
  {
    batchId: "BATCH-091",
    totalCount: 6,
    dueDate: "2026-07-10",
    status: "draft",
    createdAt: "2026-06-22T11:00:00.000Z",
    updatedAt: "2026-06-22T11:00:00.000Z",
    rows: [
      { serial: 1, sareeId: "LAKSHMI-L2-001", weaverId: "WV-018", weaverName: "Lakshmi D.",  weaverInitials: "LD", weaverLoom: 2, designCode: "BKB-019", sareeTypeCode: "BS-004", sareeTypeName: "Bridal Special", bulkOrderRef: "ORD-2026-035", bulkOrderLabel: "Vijaya Silk House · ORD-035" },
      { serial: 2, sareeId: "LAKSHMI-L2-002", weaverId: "WV-018", weaverName: "Lakshmi D.",  weaverInitials: "LD", weaverLoom: 2, designCode: "BKB-019", sareeTypeCode: "BS-004", sareeTypeName: "Bridal Special", bulkOrderRef: "ORD-2026-035", bulkOrderLabel: "Vijaya Silk House · ORD-035" },
      { serial: 3, sareeId: "LAKSHMI-L2-003", weaverId: "WV-018", weaverName: "Lakshmi D.",  weaverInitials: "LD", weaverLoom: 2, designCode: "BKB-019", sareeTypeCode: "BS-004", sareeTypeName: "Bridal Special", bulkOrderRef: "ORD-2026-035", bulkOrderLabel: "Vijaya Silk House · ORD-035" },
      { serial: 4, sareeId: null,              weaverId: null,     weaverName: null,           weaverInitials: null, weaverLoom: null, designCode: "BKB-019", sareeTypeCode: "BS-004", sareeTypeName: "Bridal Special", bulkOrderRef: "ORD-2026-035", bulkOrderLabel: "Vijaya Silk House · ORD-035" },
      { serial: 5, sareeId: null,              weaverId: null,     weaverName: null,           weaverInitials: null, weaverLoom: null, designCode: "BKB-019", sareeTypeCode: "BS-004", sareeTypeName: "Bridal Special", bulkOrderRef: null, bulkOrderLabel: null },
      { serial: 6, sareeId: null,              weaverId: null,     weaverName: null,           weaverInitials: null, weaverLoom: null, designCode: "BKB-019", sareeTypeCode: "BS-004", sareeTypeName: "Bridal Special", bulkOrderRef: null, bulkOrderLabel: null },
    ],
  },
  {
    batchId: "BATCH-078",
    totalCount: 4,
    dueDate: "2026-05-30",
    status: "completed",
    createdAt: "2026-05-10T08:00:00.000Z",
    updatedAt: "2026-05-28T10:00:00.000Z",
    rows: [
      { serial: 1, sareeId: "RAVI-L2-004", weaverId: "WV-001", weaverName: "Ravi Kumar", weaverInitials: "RK", weaverLoom: 2, designCode: "BKB-038", sareeTypeCode: "SB-001", sareeTypeName: "Self Brocade", bulkOrderRef: null, bulkOrderLabel: null, qcPassed: true },
      { serial: 2, sareeId: "RAVI-L2-005", weaverId: "WV-001", weaverName: "Ravi Kumar", weaverInitials: "RK", weaverLoom: 2, designCode: "BKB-038", sareeTypeCode: "SB-001", sareeTypeName: "Self Brocade", bulkOrderRef: null, bulkOrderLabel: null, qcPassed: true },
      { serial: 3, sareeId: "RAVI-L2-006", weaverId: "WV-001", weaverName: "Ravi Kumar", weaverInitials: "RK", weaverLoom: 2, designCode: "BKB-038", sareeTypeCode: "SB-001", sareeTypeName: "Self Brocade", bulkOrderRef: null, bulkOrderLabel: null, qcPassed: true },
      { serial: 4, sareeId: "RAVI-L2-007", weaverId: "WV-001", weaverName: "Ravi Kumar", weaverInitials: "RK", weaverLoom: 2, designCode: "BKB-038", sareeTypeCode: "SB-001", sareeTypeName: "Self Brocade", bulkOrderRef: null, bulkOrderLabel: null, qcPassed: true },
    ],
  },
  {
    batchId: "BATCH-095",
    totalCount: 14,
    dueDate: "2026-08-01",
    status: "active",
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
    rows: [
      { serial: 1, sareeId: "RAVI-L2-009", weaverId: "WV-001", weaverName: "Ravi Kumar", weaverInitials: "RK", weaverLoom: 2, designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeTypeName: "Heavy Zari", bulkOrderRef: "ORD-2026-035", bulkOrderLabel: "Padmavathi Textiles · ORD-035" },
      { serial: 2, sareeId: "PADMA-L1-006", weaverId: "WV-002", weaverName: "Padma Veni", weaverInitials: "PV", weaverLoom: 1, designCode: "BKB-045", sareeTypeCode: "SB-001", sareeTypeName: "Self Brocade", bulkOrderRef: "ORD-2026-035", bulkOrderLabel: "Padmavathi Textiles · ORD-035" },
      { serial: 3, sareeId: "BKB-L3-003", weaverId: "WV-003", weaverName: "Loom 3", weaverInitials: "L3", weaverLoom: 3, designCode: "BKB-022", sareeTypeCode: "PS-002", sareeTypeName: "Kanjivaram", bulkOrderRef: "ORD-2026-035", bulkOrderLabel: "Padmavathi Textiles · ORD-035" },
      { serial: 4, sareeId: "RAVI-L2-008", weaverId: "WV-001", weaverName: "Ravi Kumar", weaverInitials: "RK", weaverLoom: 2, designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeTypeName: "Heavy Zari", bulkOrderRef: null, bulkOrderLabel: null },
      { serial: 5, sareeId: "PADMA-L1-005", weaverId: "WV-002", weaverName: "Padma Veni", weaverInitials: "PV", weaverLoom: 1, designCode: "BKB-045", sareeTypeCode: "SB-001", sareeTypeName: "Self Brocade", bulkOrderRef: null, bulkOrderLabel: null },
      { serial: 6, sareeId: "BKB-L3-002", weaverId: "WV-003", weaverName: "Loom 3", weaverInitials: "L3", weaverLoom: 3, designCode: "BKB-022", sareeTypeCode: "PS-002", sareeTypeName: "Kanjivaram", bulkOrderRef: null, bulkOrderLabel: null },
      { serial: 7, sareeId: "BKB-INV-001", weaverId: "WV-002", weaverName: "Padma Veni", weaverInitials: "PV", weaverLoom: 1, designCode: "BKB-045", sareeTypeCode: "SB-001", sareeTypeName: "Self Brocade", bulkOrderRef: null, bulkOrderLabel: null },
      { serial: 8, sareeId: "BKB-INV-002", weaverId: "WV-001", weaverName: "Ravi Kumar", weaverInitials: "RK", weaverLoom: 2, designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeTypeName: "Heavy Zari", bulkOrderRef: null, bulkOrderLabel: null },
      { serial: 9, sareeId: "BKB-INV-003", weaverId: "WV-003", weaverName: "Loom 3", weaverInitials: "L3", weaverLoom: 3, designCode: "BKB-022", sareeTypeCode: "PS-002", sareeTypeName: "Kanjivaram", bulkOrderRef: null, bulkOrderLabel: null },
      { serial: 10, sareeId: "BKB-INV-004", weaverId: "WV-004", weaverName: "Suresh Murti", weaverInitials: "SM", weaverLoom: 2, designCode: "BKB-038", sareeTypeCode: "HZ-003", sareeTypeName: "Gadwal Cotton", bulkOrderRef: null, bulkOrderLabel: null },
      { serial: 11, sareeId: "BKB-INV-005", weaverId: "WV-005", weaverName: "Loom 1", weaverInitials: "L1", weaverLoom: 1, designCode: "BKB-019", sareeTypeCode: "PS-002", sareeTypeName: "Mysore Crepe", bulkOrderRef: null, bulkOrderLabel: null },
      { serial: 12, sareeId: "BKB-INV-006", weaverId: "WV-002", weaverName: "Padma Veni", weaverInitials: "PV", weaverLoom: 1, designCode: "BKB-052", sareeTypeCode: "BS-004", sareeTypeName: "Pochampally Ikat", bulkOrderRef: null, bulkOrderLabel: null },
      { serial: 13, sareeId: "BKB-INV-007", weaverId: "WV-001", weaverName: "Ravi Kumar", weaverInitials: "RK", weaverLoom: 2, designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeTypeName: "Heavy Zari", bulkOrderRef: null, bulkOrderLabel: null },
      { serial: 14, sareeId: "BKB-INV-008", weaverId: "WV-002", weaverName: "Padma Veni", weaverInitials: "PV", weaverLoom: 1, designCode: "BKB-045", sareeTypeCode: "SB-001", sareeTypeName: "Self Brocade", bulkOrderRef: null, bulkOrderLabel: null },
    ],
  },
];

export function BatchProvider({ children }: { children: React.ReactNode }) {
  const [batches, setBatches] = useState<BatchRecord[]>(INITIAL_BATCHES);
  const [pendingOpenBatchId, setPendingOpenBatchId] = useState<string | null>(null);

  const saveDraft = useCallback((batch: BatchRecord) => {
    setBatches(prev => {
      const exists = prev.find(b => b.batchId === batch.batchId);
      if (exists) return prev.map(b => b.batchId === batch.batchId ? { ...batch, updatedAt: new Date().toISOString() } : b);
      return [{ ...batch, status: batch.status || "draft", updatedAt: new Date().toISOString() }, ...prev];
    });
  }, []);

  const updateBatch = useCallback((batchId: string, patch: Partial<BatchRecord>) => {
    setBatches(prev => prev.map(b => b.batchId === batchId ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b));
  }, []);

  const finalizeBatch = useCallback((batchId: string) => {
    setBatches(prev => prev.map(b => b.batchId === batchId ? { ...b, status: "active", updatedAt: new Date().toISOString() } : b));
  }, []);

  const allNums = batches
    .map(b => { const m = b.batchId.match(/BATCH-(\d+)/); return m ? parseInt(m[1], 10) : 0; })
    .filter(n => n > 0);
  const maxNum = allNums.length > 0 ? Math.max(...allNums) : 93;
  const nextBatchId = `BATCH-${String(maxNum + 1).padStart(3, "0")}`;

  return (
    <BatchContext.Provider value={{ batches, saveDraft, updateBatch, finalizeBatch, nextBatchId, pendingOpenBatchId, setPendingOpenBatchId }}>
      {children}
    </BatchContext.Provider>
  );
}

export function useBatches(): BatchContextValue {
  const ctx = useContext(BatchContext);
  if (!ctx) throw new Error("useBatches must be used inside BatchProvider");
  return ctx;
}
