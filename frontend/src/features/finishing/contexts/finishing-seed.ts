import { ReadySaree, FinishingAssignment, FinishingReturn, DispatchRecord, Quotation, QuotationSaree } from "./finishing-types";

// ── Seed data ─────────────────────────────────────────────────────────────────

export const SEED_READY: ReadySaree[] = [
  { id: "RAVI-L2-009",  designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeType: "Heavy Zari",   weaverName: "Ravi Kumar", qcPassDate: "23 Jun 2026", status: "qc-passed-pending-finishing" },
  { id: "PADMA-L1-006", designCode: "BKB-045", sareeTypeCode: "SB-001", sareeType: "Self Brocade", weaverName: "Padma Veni", qcPassDate: "22 Jun 2026", status: "qc-passed-pending-finishing" },
  { id: "BKB-L3-003",   designCode: "BKB-022", sareeTypeCode: "PS-002", sareeType: "Kanjivaram",   weaverName: "Loom 3",     qcPassDate: "21 Jun 2026", status: "qc-passed-pending-finishing" },
  // In-house factory loom output awaiting finishing
  { id: "BKB-F-01-005", designCode: "BKB-045", sareeTypeCode: "SB-001", sareeType: "Self Brocade", weaverName: "Loom F-01", qcPassDate: "27 Jun 2026", status: "qc-passed-pending-finishing" },
  { id: "BKB-F-02-002", designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeType: "Heavy Zari",   weaverName: "Loom F-02", qcPassDate: "22 Jul 2026", status: "qc-passed-pending-finishing" },
];

export const SEED_ASSIGNMENTS: FinishingAssignment[] = [
  { id: "FA-001", sareeId: "RAVI-L2-008",  designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeType: "Heavy Zari",   weaverName: "Ravi Kumar", qcPassDate: "20 Jun 2026", finishingStaffId: "fs-seed-001", finishingStaffName: "Anand Kumar", assignedDate: "22 Jun 2026", assignedBy: "Ravi Kumar (WK-042)", status: "awaiting-return" },
  { id: "FA-002", sareeId: "PADMA-L1-005", designCode: "BKB-045", sareeTypeCode: "SB-001", sareeType: "Self Brocade", weaverName: "Padma Veni", qcPassDate: "18 Jun 2026", finishingStaffId: "fs-seed-002", finishingStaffName: "Renu Devi",   assignedDate: "20 Jun 2026", assignedBy: "Ravi Kumar (WK-042)", status: "awaiting-return" },
  { id: "FA-003", sareeId: "BKB-L3-002",   designCode: "BKB-022", sareeTypeCode: "PS-002", sareeType: "Kanjivaram",   weaverName: "Loom 3",     qcPassDate: "17 Jun 2026", finishingStaffId: "fs-seed-003", finishingStaffName: "Suresh Nair", assignedDate: "19 Jun 2026", assignedBy: "Ravi Kumar (WK-042)", status: "awaiting-return" },
  { id: "FA-004", sareeId: "BKB-F-01-003", designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeType: "Heavy Zari",   weaverName: "Loom F-01", qcPassDate: "21 Jun 2026", finishingStaffId: "fs-seed-001", finishingStaffName: "Anand Kumar", assignedDate: "23 Jun 2026", assignedBy: "Ravi Kumar (WK-042)", status: "awaiting-return", batchId: "BATCH-088" },
  { id: "FA-005", sareeId: "BKB-F-02-005", designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeType: "Heavy Zari",   weaverName: "Loom F-02", qcPassDate: "04 Jun 2026", finishingStaffId: "fs-seed-002", finishingStaffName: "Renu Devi",   assignedDate: "06 Jun 2026", assignedBy: "Ravi Kumar (WK-042)", status: "awaiting-return", batchId: "BATCH-088" },
];

// Seed a few already-returned sarees so the inventory page has data to show
export const SEED_RETURNS: FinishingReturn[] = [
  { id: "FR-seed-001", assignmentId: "FA-SEED-A", sareeId: "BKB-INV-001", designCode: "BKB-045", sareeTypeCode: "SB-001", sareeType: "Self Brocade",     weaverName: "Padma Veni",   condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "25 Jun 2026", inventoryStatus: "Ready for Dispatch" },
  { id: "FR-seed-002", assignmentId: "FA-SEED-B", sareeId: "BKB-INV-002", designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeType: "Heavy Zari",       weaverName: "Ravi Kumar",   condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "24 Jun 2026", inventoryStatus: "Ready for Dispatch" },
  { id: "FR-seed-003", assignmentId: "FA-SEED-C", sareeId: "BKB-INV-003", designCode: "BKB-022", sareeTypeCode: "PS-002", sareeType: "Kanjivaram",       weaverName: "Loom 3",       condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "23 Jun 2026", inventoryStatus: "Ready for Dispatch" },
  { id: "FR-seed-004", assignmentId: "FA-SEED-D", sareeId: "BKB-INV-004", designCode: "BKB-038", sareeTypeCode: "HZ-003", sareeType: "Gadwal Cotton",    weaverName: "Suresh Murti", condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "22 Jun 2026", inventoryStatus: "Ready for Dispatch" },
  { id: "FR-seed-005", assignmentId: "FA-SEED-E", sareeId: "BKB-INV-005", designCode: "BKB-019", sareeTypeCode: "PS-002", sareeType: "Mysore Crepe",     weaverName: "Loom 1",       condition: "damaged", damageType: "Thread Break", damageSeverity: "Minor",    damageNotes: "Small thread break near border", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "21 Jun 2026", inventoryStatus: "Damaged — Review Needed" },
  { id: "FR-seed-006", assignmentId: "FA-SEED-F", sareeId: "BKB-INV-006", designCode: "BKB-052", sareeTypeCode: "BS-004", sareeType: "Pochampally Ikat", weaverName: "Padma Veni",   condition: "damaged", damageType: "Stain",        damageSeverity: "Moderate", damageNotes: "Oil stain on pallu",             receivedBy: "Ravi Kumar (WK-042)", receivedDate: "20 Jun 2026", inventoryStatus: "Damaged — Review Needed" },
  { id: "FR-seed-007", assignmentId: "FA-SEED-G", sareeId: "BKB-INV-007", designCode: "BKB-031", sareeTypeCode: "HZ-003", sareeType: "Heavy Zari",       weaverName: "Ravi Kumar",   condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "18 Jun 2026", inventoryStatus: "Dispatched", dispatchId: "DISP-seed-001" },
  { id: "FR-seed-008", assignmentId: "FA-SEED-H", sareeId: "BKB-INV-008", designCode: "BKB-045", sareeTypeCode: "SB-001", sareeType: "Self Brocade",     weaverName: "Padma Veni",   condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "17 Jun 2026", inventoryStatus: "Dispatched", dispatchId: "DISP-seed-001" },
  // Factory loom sarees that have come back from finishing
  { id: "FR-seed-009", assignmentId: "FA-SEED-I", sareeId: "BKB-F-01-001", designCode: "BKB-045", sareeTypeCode: "SB-001", sareeType: "Self Brocade", weaverName: "Loom F-01", condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "26 Jun 2026", inventoryStatus: "Ready for Dispatch" },
  { id: "FR-seed-010", assignmentId: "FA-SEED-J", sareeId: "BKB-F-01-002", designCode: "BKB-045", sareeTypeCode: "SB-001", sareeType: "Self Brocade", weaverName: "Loom F-01", condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "25 Jun 2026", inventoryStatus: "Ready for Dispatch" },
  { id: "FR-seed-011", assignmentId: "FA-SEED-K", sareeId: "BKB-F-02-001", designCode: "BKB-019", sareeTypeCode: "BS-004", sareeType: "Bridal Special", weaverName: "Loom F-02", condition: "perfect", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "12 May 2026", inventoryStatus: "Ready for Dispatch" },
  { id: "FR-seed-012", assignmentId: "FA-SEED-L", sareeId: "BKB-F-02-004", designCode: "BKB-045", sareeTypeCode: "SB-001", sareeType: "Self Brocade", weaverName: "Loom F-02", condition: "damaged", damageType: "Stain", damageSeverity: "Minor", damageNotes: "Light mark near the border", receivedBy: "Ravi Kumar (WK-042)", receivedDate: "18 May 2026", inventoryStatus: "Damaged — Review Needed" },
];

export const SEED_DISPATCHES: DispatchRecord[] = [
  { id: "DISP-seed-001", type: "shop", sareeIds: ["BKB-INV-007", "BKB-INV-008"], dispatchDate: "20 Jun 2026", lrNumber: "LR-20260620-001", transportCompany: "Shyam Carriers", vehicleNumber: "AP09AB1234", driverName: "Ramesh", notes: "" },
];

export const SEED_QUOTATIONS: Quotation[] = [
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