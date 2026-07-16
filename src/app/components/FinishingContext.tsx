import React, { createContext, useContext, useState, useCallback } from "react";

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
}

export interface FinishingReturn {
  id: string;
  assignmentId: string;
  sareeId: string;
  designCode: string;
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
}

interface FinishingContextValue {
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
    receivedBy: string;
    receivedDate: string;
  }) => void;
  dispatchSarees: (sareeIds: string[], record: Omit<DispatchRecord, "id">) => void;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_READY: ReadySaree[] = [
  { id: "PADMA-L1-007", designCode: "BKB-045",  sareeType: "Self Brocade",     weaverName: "Padma Veni",   qcPassDate: "28 Jun 2026", status: "qc-passed-pending-finishing" },
  { id: "RAVI-L2-011",  designCode: "BKB-031",  sareeType: "Heavy Zari",       weaverName: "Ravi Kumar",   qcPassDate: "27 Jun 2026", status: "qc-passed-pending-finishing" },
  { id: "BKB-L3-005",   designCode: "BKB-022",  sareeType: "Kanjivaram",       weaverName: "Loom 3",       qcPassDate: "26 Jun 2026", status: "qc-passed-pending-finishing" },
  { id: "SURESH-L2-004",designCode: "BKB-038",  sareeType: "Gadwal Cotton",    weaverName: "Suresh Murti", qcPassDate: "26 Jun 2026", status: "qc-passed-pending-finishing" },
  { id: "BKB-L1-009",   designCode: "BKB-019",  sareeType: "Mysore Crepe",     weaverName: "Loom 1",       qcPassDate: "25 Jun 2026", status: "qc-passed-pending-finishing" },
  { id: "PADMA-L1-008", designCode: "BKB-052",  sareeType: "Pochampally Ikat", weaverName: "Padma Veni",   qcPassDate: "24 Jun 2026", status: "qc-passed-pending-finishing" },
];

const SEED_ASSIGNMENTS: FinishingAssignment[] = [
  { id: "FA-001", sareeId: "RAVI-L2-008",  designCode: "BKB-031", sareeType: "Heavy Zari",   weaverName: "Ravi Kumar", qcPassDate: "20 Jun 2026", finishingStaffId: "fs-seed-001", finishingStaffName: "Anand Kumar", assignedDate: "22 Jun 2026", assignedBy: "Ravi Kumar (WK-042)", status: "awaiting-return" },
  { id: "FA-002", sareeId: "PADMA-L1-005", designCode: "BKB-045", sareeType: "Self Brocade", weaverName: "Padma Veni", qcPassDate: "18 Jun 2026", finishingStaffId: "fs-seed-002", finishingStaffName: "Renu Devi",   assignedDate: "20 Jun 2026", assignedBy: "Ravi Kumar (WK-042)", status: "awaiting-return" },
  { id: "FA-003", sareeId: "BKB-L3-002",   designCode: "BKB-022", sareeType: "Kanjivaram",   weaverName: "Loom 3",     qcPassDate: "17 Jun 2026", finishingStaffId: "fs-seed-003", finishingStaffName: "Suresh Nair", assignedDate: "19 Jun 2026", assignedBy: "Ravi Kumar (WK-042)", status: "awaiting-return" },
];

// Seed a few already-returned sarees so the inventory page has data to show
const SEED_RETURNS: FinishingReturn[] = [
  { id: "FR-seed-001", assignmentId: "FA-SEED-A", sareeId: "BKB-INV-001", designCode: "BKB-045", sareeType: "Self Brocade",     weaverName: "Padma Veni",   condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "25 Jun 2026", inventoryStatus: "Ready for Dispatch" },
  { id: "FR-seed-002", assignmentId: "FA-SEED-B", sareeId: "BKB-INV-002", designCode: "BKB-031", sareeType: "Heavy Zari",       weaverName: "Ravi Kumar",   condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "24 Jun 2026", inventoryStatus: "Ready for Dispatch" },
  { id: "FR-seed-003", assignmentId: "FA-SEED-C", sareeId: "BKB-INV-003", designCode: "BKB-022", sareeType: "Kanjivaram",       weaverName: "Loom 3",       condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "23 Jun 2026", inventoryStatus: "Ready for Dispatch" },
  { id: "FR-seed-004", assignmentId: "FA-SEED-D", sareeId: "BKB-INV-004", designCode: "BKB-038", sareeType: "Gadwal Cotton",    weaverName: "Suresh Murti", condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "22 Jun 2026", inventoryStatus: "Ready for Dispatch" },
  { id: "FR-seed-005", assignmentId: "FA-SEED-E", sareeId: "BKB-INV-005", designCode: "BKB-019", sareeType: "Mysore Crepe",     weaverName: "Loom 1",       condition: "damaged", damageType: "Thread Break", damageSeverity: "Minor",    damageNotes: "Small thread break near border", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "21 Jun 2026", inventoryStatus: "Damaged — Review Needed" },
  { id: "FR-seed-006", assignmentId: "FA-SEED-F", sareeId: "BKB-INV-006", designCode: "BKB-052", sareeType: "Pochampally Ikat", weaverName: "Padma Veni",   condition: "damaged", damageType: "Stain",        damageSeverity: "Moderate", damageNotes: "Oil stain on pallu",             receivedBy: "Ravi Kumar (WK-042)", receivedDate: "20 Jun 2026", inventoryStatus: "Damaged — Review Needed" },
  { id: "FR-seed-007", assignmentId: "FA-SEED-G", sareeId: "BKB-INV-007", designCode: "BKB-031", sareeType: "Heavy Zari",       weaverName: "Ravi Kumar",   condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "18 Jun 2026", inventoryStatus: "Dispatched", dispatchId: "DISP-seed-001" },
  { id: "FR-seed-008", assignmentId: "FA-SEED-H", sareeId: "BKB-INV-008", designCode: "BKB-045", sareeType: "Self Brocade",     weaverName: "Padma Veni",   condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "17 Jun 2026", inventoryStatus: "Dispatched", dispatchId: "DISP-seed-001" },
];

const SEED_DISPATCHES: DispatchRecord[] = [
  { id: "DISP-seed-001", type: "shop", sareeIds: ["BKB-INV-007", "BKB-INV-008"], dispatchDate: "20 Jun 2026", lrNumber: "LR-20260620-001", transportCompany: "Shyam Carriers", vehicleNumber: "AP09AB1234", driverName: "Ramesh", notes: "" },
];

// ── Context ───────────────────────────────────────────────────────────────────

const FinishingContext = createContext<FinishingContextValue | null>(null);

export function FinishingProvider({ children }: { children: React.ReactNode }) {
  const [readySarees,  setReadySarees]  = useState<ReadySaree[]>(SEED_READY);
  const [assignments,  setAssignments]  = useState<FinishingAssignment[]>(SEED_ASSIGNMENTS);
  const [returns,      setReturns]      = useState<FinishingReturn[]>(SEED_RETURNS);
  const [dispatches,   setDispatches]   = useState<DispatchRecord[]>(SEED_DISPATCHES);

  const assignSarees = useCallback((
    sareeIds: string[],
    staff: { id: string; name: string },
    assignedBy: string,
  ) => {
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const selected = readySarees.filter(s => sareeIds.includes(s.id));
    const newAssignments: FinishingAssignment[] = selected.map((s, i) => ({
      id: `FA-${Date.now()}-${i}`,
      sareeId: s.id,
      designCode: s.designCode,
      sareeType: s.sareeType,
      weaverName: s.weaverName,
      qcPassDate: s.qcPassDate,
      finishingStaffId: staff.id,
      finishingStaffName: staff.name,
      assignedDate: today,
      assignedBy,
      status: "awaiting-return",
    }));
    setAssignments(prev => [...prev, ...newAssignments]);
    setReadySarees(prev => prev.filter(s => !sareeIds.includes(s.id)));
  }, [readySarees]);

  const addReadySaree = useCallback((saree: ReadySaree) => {
    setReadySarees(prev => prev.some(s => s.id === saree.id) ? prev : [saree, ...prev]);
  }, []);

  const receiveReturn = useCallback((params: {
    assignmentId: string;
    sareeId: string;
    condition: "perfect" | "damaged";
    damageType?: string;
    damageSeverity?: "Minor" | "Moderate" | "Severe";
    damageNotes?: string;
    damagePhotoUrl?: string;
    receivedBy: string;
    receivedDate: string;
  }) => {
    // Look up the assignment to get design/type info
    const assignment = assignments.find(a => a.id === params.assignmentId)
      ?? SEED_ASSIGNMENTS.find(a => a.id === params.assignmentId) as FinishingAssignment | undefined;
    const ret: FinishingReturn = {
      id: `FR-${Date.now()}`,
      assignmentId: params.assignmentId,
      sareeId: params.sareeId,
      designCode: assignment?.designCode ?? "—",
      sareeType: assignment?.sareeType ?? "—",
      weaverName: assignment?.weaverName ?? "—",
      condition: params.condition,
      damageType: params.damageType,
      damageSeverity: params.damageSeverity,
      damageNotes: params.damageNotes,
      damagePhotoUrl: params.damagePhotoUrl,
      receivedBy: params.receivedBy,
      receivedDate: params.receivedDate,
      inventoryStatus: params.condition === "perfect" ? "Ready for Dispatch" : "Damaged — Review Needed",
    };
    setReturns(prev => [...prev, ret]);
    setAssignments(prev => prev.map(a => a.id === params.assignmentId ? { ...a, status: "returned" } : a));
  }, [assignments]);

  const dispatchSarees = useCallback((sareeIds: string[], record: Omit<DispatchRecord, "id">) => {
    const id = `DISP-${Date.now()}`;
    const fullRecord: DispatchRecord = { ...record, id, sareeIds };
    setDispatches(prev => [...prev, fullRecord]);
    
    // Move any dispatched sarees that are currently in readySarees to returns
    setReadySarees(prev => {
      const remaining = prev.filter(s => !sareeIds.includes(s.id));
      const moved = prev.filter(s => sareeIds.includes(s.id));
      if (moved.length > 0) {
        setReturns(oldReturns => [
          ...oldReturns,
          ...moved.map((s, idx) => ({
            id: `FR-${Date.now()}-${idx}`,
            assignmentId: "DIRECT-DISPATCH",
            sareeId: s.id,
            designCode: s.designCode,
            sareeType: s.sareeType,
            weaverName: s.weaverName,
            condition: "perfect" as const,
            receivedBy: "Admin Direct Dispatch",
            receivedDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
            inventoryStatus: "Dispatched" as const,
            dispatchId: id
          }))
        ]);
      }
      return remaining;
    });

    setAssignments(prev => prev.map(a =>
      sareeIds.includes(a.sareeId) ? { ...a, status: "returned" } : a
    ));

    setReturns(prev => prev.map(r =>
      sareeIds.includes(r.sareeId)
        ? { ...r, inventoryStatus: "Dispatched", dispatchId: id }
        : r
    ));
  }, []);

  return (
    <FinishingContext.Provider value={{ readySarees, assignments, returns, dispatches, assignSarees, addReadySaree, receiveReturn, dispatchSarees }}>
      {children}
    </FinishingContext.Provider>
  );
}

export function useFinishing(): FinishingContextValue {
  const ctx = useContext(FinishingContext);
  if (!ctx) throw new Error("useFinishing must be used inside FinishingProvider");
  return ctx;
}
