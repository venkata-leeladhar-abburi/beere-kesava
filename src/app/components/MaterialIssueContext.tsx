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
];

// ─── Context ──────────────────────────────────────────────────────────────────
interface MaterialIssueContextValue {
  issueRecords: MaterialIssueRecord[];
  addIssueRecord: (record: Omit<MaterialIssueRecord, "id">) => MaterialIssueRecord;
  getRecordsForWeaver: (weaverId: string) => MaterialIssueRecord[];
  updateSignatureStatus: (recordId: string, method: "here" | "remote") => void;
}

const MaterialIssueContext = createContext<MaterialIssueContextValue | null>(null);

export function MaterialIssueProvider({ children }: { children: React.ReactNode }) {
  const [issueRecords, setIssueRecords] = useState<MaterialIssueRecord[]>(INITIAL_ISSUE_RECORDS);

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
    <MaterialIssueContext.Provider value={{ issueRecords, addIssueRecord, getRecordsForWeaver, updateSignatureStatus }}>
      {children}
    </MaterialIssueContext.Provider>
  );
}

export function useMaterialIssue(): MaterialIssueContextValue {
  const ctx = useContext(MaterialIssueContext);
  if (!ctx) throw new Error("useMaterialIssue must be used inside MaterialIssueProvider");
  return ctx;
}
