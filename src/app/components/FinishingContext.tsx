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
    damagePhotoUrl?: string;
    receivedBy: string;
    receivedDate: string;
  }) => void;
  dispatchSarees: (sareeIds: string[], record: Omit<DispatchRecord, "id">) => void;
  quotations: Quotation[];
  raiseQuotation: (q: Omit<Quotation, "id" | "createdAt">) => string;
  assignQuotationFinishing: (quotationId: string, staff: { id: string; name: string }, assignedBy: string) => void;
  receiveQuotationSarees: (quotationId: string, sareeIds: string[], receivedBy: string) => void;
  markQuotationDispatched: (quotationId: string, dispatchId: string) => void;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_READY: ReadySaree[] = [
  { id: "RAVI-L2-009",  designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeType: "Heavy Zari",   weaverName: "Ravi Kumar", qcPassDate: "23 Jun 2026", status: "qc-passed-pending-finishing" },
  { id: "PADMA-L1-006", designCode: "BKB-045", sareeTypeCode: "SB-001", sareeType: "Self Brocade", weaverName: "Padma Veni", qcPassDate: "22 Jun 2026", status: "qc-passed-pending-finishing" },
  { id: "BKB-L3-003",   designCode: "BKB-022", sareeTypeCode: "PS-002", sareeType: "Kanjivaram",   weaverName: "Loom 3",     qcPassDate: "21 Jun 2026", status: "qc-passed-pending-finishing" },
];

const SEED_ASSIGNMENTS: FinishingAssignment[] = [
  { id: "FA-001", sareeId: "RAVI-L2-008",  designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeType: "Heavy Zari",   weaverName: "Ravi Kumar", qcPassDate: "20 Jun 2026", finishingStaffId: "fs-seed-001", finishingStaffName: "Anand Kumar", assignedDate: "22 Jun 2026", assignedBy: "Ravi Kumar (WK-042)", status: "awaiting-return" },
  { id: "FA-002", sareeId: "PADMA-L1-005", designCode: "BKB-045", sareeTypeCode: "SB-001", sareeType: "Self Brocade", weaverName: "Padma Veni", qcPassDate: "18 Jun 2026", finishingStaffId: "fs-seed-002", finishingStaffName: "Renu Devi",   assignedDate: "20 Jun 2026", assignedBy: "Ravi Kumar (WK-042)", status: "awaiting-return" },
  { id: "FA-003", sareeId: "BKB-L3-002",   designCode: "BKB-022", sareeTypeCode: "PS-002", sareeType: "Kanjivaram",   weaverName: "Loom 3",     qcPassDate: "17 Jun 2026", finishingStaffId: "fs-seed-003", finishingStaffName: "Suresh Nair", assignedDate: "19 Jun 2026", assignedBy: "Ravi Kumar (WK-042)", status: "awaiting-return" },
];

// Seed a few already-returned sarees so the inventory page has data to show
const SEED_RETURNS: FinishingReturn[] = [
  { id: "FR-seed-001", assignmentId: "FA-SEED-A", sareeId: "BKB-INV-001", designCode: "BKB-045", sareeTypeCode: "SB-001", sareeType: "Self Brocade",     weaverName: "Padma Veni",   condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "25 Jun 2026", inventoryStatus: "Ready for Dispatch" },
  { id: "FR-seed-002", assignmentId: "FA-SEED-B", sareeId: "BKB-INV-002", designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeType: "Heavy Zari",       weaverName: "Ravi Kumar",   condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "24 Jun 2026", inventoryStatus: "Ready for Dispatch" },
  { id: "FR-seed-003", assignmentId: "FA-SEED-C", sareeId: "BKB-INV-003", designCode: "BKB-022", sareeTypeCode: "PS-002", sareeType: "Kanjivaram",       weaverName: "Loom 3",       condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "23 Jun 2026", inventoryStatus: "Ready for Dispatch" },
  { id: "FR-seed-004", assignmentId: "FA-SEED-D", sareeId: "BKB-INV-004", designCode: "BKB-038", sareeTypeCode: "HZ-003", sareeType: "Gadwal Cotton",    weaverName: "Suresh Murti", condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "22 Jun 2026", inventoryStatus: "Ready for Dispatch" },
  { id: "FR-seed-005", assignmentId: "FA-SEED-E", sareeId: "BKB-INV-005", designCode: "BKB-019", sareeTypeCode: "PS-002", sareeType: "Mysore Crepe",     weaverName: "Loom 1",       condition: "damaged", damageType: "Thread Break", damageSeverity: "Minor",    damageNotes: "Small thread break near border", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "21 Jun 2026", inventoryStatus: "Damaged — Review Needed" },
  { id: "FR-seed-006", assignmentId: "FA-SEED-F", sareeId: "BKB-INV-006", designCode: "BKB-052", sareeTypeCode: "BS-004", sareeType: "Pochampally Ikat", weaverName: "Padma Veni",   condition: "damaged", damageType: "Stain",        damageSeverity: "Moderate", damageNotes: "Oil stain on pallu",             receivedBy: "Ravi Kumar (WK-042)", receivedDate: "20 Jun 2026", inventoryStatus: "Damaged — Review Needed" },
  { id: "FR-seed-007", assignmentId: "FA-SEED-G", sareeId: "BKB-INV-007", designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeType: "Heavy Zari",       weaverName: "Ravi Kumar",   condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "18 Jun 2026", inventoryStatus: "Dispatched", dispatchId: "DISP-seed-001" },
  { id: "FR-seed-008", assignmentId: "FA-SEED-H", sareeId: "BKB-INV-008", designCode: "BKB-045", sareeTypeCode: "SB-001", sareeType: "Self Brocade",     weaverName: "Padma Veni",   condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "17 Jun 2026", inventoryStatus: "Dispatched", dispatchId: "DISP-seed-001" },
];

const SEED_DISPATCHES: DispatchRecord[] = [
  { id: "DISP-seed-001", type: "shop", sareeIds: ["BKB-INV-007", "BKB-INV-008"], dispatchDate: "20 Jun 2026", lrNumber: "LR-20260620-001", transportCompany: "Shyam Carriers", vehicleNumber: "AP09AB1234", driverName: "Ramesh", notes: "" },
];

const SEED_QUOTATIONS: Quotation[] = [
  {
    id: "QT-seed-001",
    quotationNumber: "QT-2026-001",
    quotationDate: "26 Jun 2026",
    customerId: "WHL-001",
    customerName: "Lakshmi Silks",
    customerCity: "Hyderabad",
    customerPhone: "+91 98450 11223",
    customerAddress: "G-12, Silk Plaza, Madhapur, Hyderabad - 500081",
    customerGst: "36AAAAA1111A1Z1",
    sarees: [
      { sareeId: "BKB-QT-101", designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeType: "Heavy Zari",   weaverName: "Ravi Kumar", finishingStatus: "pending" },
      { sareeId: "BKB-QT-102", designCode: "BKB-045", sareeTypeCode: "SB-001", sareeType: "Self Brocade", weaverName: "Padma Veni", finishingStatus: "pending" },
    ],
    prices: { "BKB-QT-101": "12000", "BKB-QT-102": "9500" },
    applyGst: true,
    gstPct: "5",
    firmId: "",
    notes: "Priority order for festive season.",
    subtotal: 21500,
    grandTotal: 22575,
    raisedBy: "Admin",
    status: "raised",
    createdAt: Date.now() - 86400000,
  },
];

// ── Context ───────────────────────────────────────────────────────────────────

const FinishingContext = createContext<FinishingContextValue | null>(null);

export function FinishingProvider({ children }: { children: React.ReactNode }) {
  const [readySarees,  setReadySarees]  = useState<ReadySaree[]>(SEED_READY);
  const [assignments,  setAssignments]  = useState<FinishingAssignment[]>(SEED_ASSIGNMENTS);
  const [returns,      setReturns]      = useState<FinishingReturn[]>(SEED_RETURNS);
  const [dispatches,   setDispatches]   = useState<DispatchRecord[]>(SEED_DISPATCHES);
  const [quotations,   setQuotations]   = useState<Quotation[]>(SEED_QUOTATIONS);

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
      sareeTypeCode: s.sareeTypeCode,
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
      sareeTypeCode: assignment?.sareeTypeCode,
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

  const todayLabel = () => new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const raiseQuotation = useCallback((q: Omit<Quotation, "id" | "createdAt">) => {
    const id = `QT-${Date.now()}`;
    setQuotations(prev => [{ ...q, id, createdAt: Date.now() }, ...prev]);
    return id;
  }, []);

  const assignQuotationFinishing = useCallback((
    quotationId: string,
    staff: { id: string; name: string },
    assignedBy: string,
  ) => {
    const today = todayLabel();
    const q = quotations.find(x => x.id === quotationId);
    if (!q) return;

    setQuotations(prev => prev.map(x => x.id === quotationId ? {
      ...x,
      status: "in-finishing",
      finishingStaffId: staff.id,
      finishingStaffName: staff.name,
      assignedDate: today,
      sarees: x.sarees.map(s => ({ ...s, finishingStatus: "in-finishing" as const })),
    } : x));

    // Mirror each quotation saree into the finishing assignments list so it is tracked.
    const stamp = Date.now();
    const newAssignments: FinishingAssignment[] = q.sarees.map((s, i) => ({
      id: `FA-QT-${stamp}-${i}`,
      sareeId: s.sareeId,
      designCode: s.designCode,
      sareeTypeCode: s.sareeTypeCode,
      sareeType: s.sareeType,
      weaverName: s.weaverName,
      qcPassDate: q.quotationDate,
      finishingStaffId: staff.id,
      finishingStaffName: staff.name,
      assignedDate: today,
      assignedBy,
      status: "awaiting-return",
    }));
    setAssignments(a => [...a, ...newAssignments]);
  }, [quotations]);

  const receiveQuotationSarees = useCallback((
    quotationId: string,
    sareeIds: string[],
    receivedBy: string,
  ) => {
    const today = todayLabel();
    const q = quotations.find(x => x.id === quotationId);
    if (!q) return;

    setQuotations(prev => prev.map(x => {
      if (x.id !== quotationId) return x;
      const sarees = x.sarees.map(s =>
        sareeIds.includes(s.sareeId) ? { ...s, finishingStatus: "received" as const } : s
      );
      const allReceived = sarees.every(s => s.finishingStatus === "received");
      const anyReceived = sarees.some(s => s.finishingStatus === "received");
      return { ...x, sarees, status: allReceived ? "received" : anyReceived ? "partially-received" : x.status };
    }));

    // Push received sarees into inventory as Ready-for-Dispatch returns, tagged with the quotation.
    const stamp = Date.now();
    const newReturns: FinishingReturn[] = q.sarees
      .filter(s => sareeIds.includes(s.sareeId))
      .map((s, i) => ({
        id: `FR-QT-${stamp}-${i}`,
        assignmentId: `QT:${quotationId}`,
        sareeId: s.sareeId,
        designCode: s.designCode,
        sareeTypeCode: s.sareeTypeCode,
        sareeType: s.sareeType,
        weaverName: s.weaverName,
        condition: "perfect" as const,
        receivedBy,
        receivedDate: today,
        inventoryStatus: "Ready for Dispatch" as const,
        quotationRef: q.quotationNumber,
      }));
    setReturns(r => [...r, ...newReturns]);
    setAssignments(a => a.map(as => sareeIds.includes(as.sareeId) ? { ...as, status: "returned" as const } : as));
  }, [quotations]);

  const markQuotationDispatched = useCallback((quotationId: string, _dispatchId: string) => {
    setQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, status: "dispatched" } : q));
  }, []);

  return (
    <FinishingContext.Provider value={{ readySarees, assignments, returns, dispatches, assignSarees, addReadySaree, receiveReturn, dispatchSarees, quotations, raiseQuotation, assignQuotationFinishing, receiveQuotationSarees, markQuotationDispatched }}>
      {children}
    </FinishingContext.Provider>
  );
}

export function useFinishing(): FinishingContextValue {
  const ctx = useContext(FinishingContext);
  if (!ctx) throw new Error("useFinishing must be used inside FinishingProvider");
  return ctx;
}
