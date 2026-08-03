import { LoomBatch, LoomMaterial, LoomSaree } from "./types";

// ── Data ─────────────────────────────────────────────────────────────────────
export const SAMPLE_BATCHES: LoomBatch[] = [
  { batchId: "BATCH-094", loomId: "FL-001", sareeCount: 10, completedCount: 7, dueDate: "20 Jul 2026", designCode: "DS-019", designName: "Grand Kanjivaram Pallu", orderRef: "Lakshmi Silks · ORD-041", status: "active", startDate: "01 Jul 2026" },
  { batchId: "BATCH-088", loomId: "FL-001", sareeCount: 12, completedCount: 12, dueDate: "05 Jul 2026", designCode: "DS-015", designName: "Classic Zari Border", orderRef: "Padma Stores · ORD-038", status: "completed", startDate: "20 Jun 2026" },
  { batchId: "BATCH-091", loomId: "FL-002", sareeCount: 8, completedCount: 3, dueDate: "25 Jul 2026", designCode: "DS-021", designName: "Peacock Motif Dobby", orderRef: "Annapurna Silks · ORD-043", status: "active", startDate: "05 Jul 2026" },
  { batchId: "BATCH-085", loomId: "FL-002", sareeCount: 6, completedCount: 6, dueDate: "28 Jun 2026", designCode: "DS-012", designName: "Temple Border Series", orderRef: "Rajam Silks · ORD-035", status: "completed", startDate: "10 Jun 2026" },
  { batchId: "BATCH-092", loomId: "FL-003", sareeCount: 10, completedCount: 0, dueDate: "30 Jul 2026", designCode: "DS-022", designName: "Royal Blue Brocade", orderRef: "N/A", status: "draft", startDate: "—" },
  { batchId: "BATCH-095", loomId: "FL-005", sareeCount: 14, completedCount: 5, dueDate: "01 Aug 2026", designCode: "DS-025", designName: "Silk Elegance Collection", orderRef: "Star Boutique · ORD-047", status: "active", startDate: "10 Jul 2026" },
];
export const SAMPLE_MATERIALS: LoomMaterial[] = [
  { batchId: "BATCH-094", loomId: "FL-001", mirId: "MIR-2026-041", date: "01 Jul 2026", materialType: "Warp", description: "Cotton/Silk blend warp", quantity: 4.5, unit: "kg", grnBatch: "GRN-2026-JUN-001", issuedBy: "Admin (Kesava Rao)" },
  { batchId: "BATCH-094", loomId: "FL-001", mirId: "MIR-2026-041", date: "01 Jul 2026", materialType: "Resham", description: "Red Resham", quantity: 0.8, unit: "kg", grnBatch: "GRN-2026-JUN-002", issuedBy: "Admin (Kesava Rao)" },
  { batchId: "BATCH-094", loomId: "FL-001", mirId: "MIR-2026-043", date: "05 Jul 2026", materialType: "Jari", description: "Polyester 2G Gold", quantity: 8, unit: "Reels", grnBatch: "GRN-2026-JUN-003", issuedBy: "Admin (Kesava Rao)" },
  { batchId: "BATCH-088", loomId: "FL-001", mirId: "MIR-2026-028", date: "20 Jun 2026", materialType: "Warp", description: "Pure Silk Warp", quantity: 6.0, unit: "kg", grnBatch: "GRN-2026-MAY-006", issuedBy: "Admin (Kesava Rao)" },
  { batchId: "BATCH-091", loomId: "FL-002", mirId: "MIR-2026-044", date: "06 Jul 2026", materialType: "Jari", description: "Gold 1G Polyester", quantity: 4, unit: "Buns", grnBatch: "GRN-2026-MAY-014", issuedBy: "Admin (Kesava Rao)" },
  { batchId: "BATCH-091", loomId: "FL-002", mirId: "MIR-2026-044", date: "06 Jul 2026", materialType: "Warp", description: "Resham Warp blend", quantity: 3.5, unit: "kg", grnBatch: "GRN-2026-JUN-001", issuedBy: "Admin (Kesava Rao)" },
  { batchId: "BATCH-095", loomId: "FL-005", mirId: "MIR-2026-048", date: "10 Jul 2026", materialType: "Warp", description: "Silk warp — premium", quantity: 8.0, unit: "kg", grnBatch: "GRN-2026-JUN-001", issuedBy: "Admin (Kesava Rao)" },
  { batchId: "BATCH-095", loomId: "FL-005", mirId: "MIR-2026-048", date: "10 Jul 2026", materialType: "Jari", description: "5G Gold Silk fast", quantity: 6, unit: "Buns", grnBatch: "GRN-2026-JUN-003", issuedBy: "Admin (Kesava Rao)" },
];
export const SAMPLE_SAREES: LoomSaree[] = [
  { sareeId: "FL001-L1-001", loomId: "FL-001", batchId: "BATCH-094", sareeType: "SB-001", status: "complete", completedDate: "06 Jul 2026", qualityStatus: "pass" },
  { sareeId: "FL001-L1-002", loomId: "FL-001", batchId: "BATCH-094", sareeType: "SB-001", status: "complete", completedDate: "07 Jul 2026", qualityStatus: "pass" },
  { sareeId: "FL001-L1-003", loomId: "FL-001", batchId: "BATCH-094", sareeType: "SB-001", status: "complete", completedDate: "08 Jul 2026", qualityStatus: "fail" },
  { sareeId: "FL001-L1-004", loomId: "FL-001", batchId: "BATCH-094", sareeType: "SB-001", status: "complete", completedDate: "09 Jul 2026", qualityStatus: "pass" },
  { sareeId: "FL001-L1-005", loomId: "FL-001", batchId: "BATCH-094", sareeType: "SB-001", status: "in-progress" },
  { sareeId: "FL001-L1-006", loomId: "FL-001", batchId: "BATCH-094", sareeType: "SB-001", status: "in-progress" },
  { sareeId: "FL001-L1-007", loomId: "FL-001", batchId: "BATCH-094", sareeType: "SB-001", status: "pending" },
  { sareeId: "FL002-L1-001", loomId: "FL-002", batchId: "BATCH-091", sareeType: "SB-002", status: "complete", completedDate: "10 Jul 2026", qualityStatus: "pass" },
  { sareeId: "FL002-L1-002", loomId: "FL-002", batchId: "BATCH-091", sareeType: "SB-002", status: "complete", completedDate: "12 Jul 2026", qualityStatus: "pass" },
  { sareeId: "FL002-L1-003", loomId: "FL-002", batchId: "BATCH-091", sareeType: "SB-002", status: "in-progress" },
  { sareeId: "FL005-L1-001", loomId: "FL-005", batchId: "BATCH-095", sareeType: "SB-003", status: "complete", completedDate: "14 Jul 2026", qualityStatus: "pass" },
  { sareeId: "FL005-L1-002", loomId: "FL-005", batchId: "BATCH-095", sareeType: "SB-003", status: "complete", completedDate: "15 Jul 2026", qualityStatus: "pass" },
  { sareeId: "FL005-L1-003", loomId: "FL-005", batchId: "BATCH-095", sareeType: "SB-003", status: "in-progress" },
];
