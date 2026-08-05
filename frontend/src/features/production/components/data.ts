import type React from "react";
import { CheckCircle, WarningCircle, XCircle, SquaresFour, ListDashes, List as PhList } from "@phosphor-icons/react";
import { T } from "./theme";
import type { BulkOrder, OrderStatus, BatchStage, Batch, HistoryBatch } from "./types";

// ─── SECTION 2 — Stats strip ───────────────────────────────────────────────────
export const STATS = [
  { label: "TOTAL BATCHES ACTIVE RIGHT NOW",    value: "24",  sub: "Across all weavers currently",       highlight: false, crimson: false, goldVal: false },
  { label: "SAREES BEING PRODUCED",             value: "186", sub: "In progress across all batches",      highlight: false, crimson: false, goldVal: false },
  { label: "SAREES COMPLETED THIS MONTH",       value: "248", sub: "↑ 14% more than last month",          highlight: true,  crimson: false, goldVal: true  },
  { label: "SAREES WAITING FOR QUALITY CHECK",  value: "32",  sub: "⚠ Need quality check today",          highlight: false, crimson: true,  goldVal: false },
];

// ─── SECTION 3 — Bulk orders ────────────────────────────────────────────────────
export const BULK_ORDERS: BulkOrder[] = [
  { customer: "Lakshmi Silks",          ref: "ORD-2026-041", due: "28 May 2026", status: "on-track",              sareeType: "Self Brocade · SB-001",    design: "BKB-045", done: 76, total: 80,              paymentStatus: "partial", amountDue: 250000, amountPaid: 150000 },
  { customer: "Padmavathi Textiles",    ref: "ORD-2026-038", due: "25 May 2026", status: "at-risk",  daysLeft: 2,  sareeType: "Heavy Zari · HZ-003",      design: "BKB-031", done: 42, total: 60, shortage: 18, paymentStatus: "pending", amountDue: 180000, amountPaid: 0 },
  { customer: "Vijaya Silk House",      ref: "ORD-2026-035", due: "30 May 2026", status: "on-track",              sareeType: "Plain Silk · PS-002",       design: "BKB-022", done: 28, total: 30,              paymentStatus: "paid",    amountDue: 90000,  amountPaid: 90000 },
  { customer: "Narayana Silk Emporium", ref: "ORD-2026-032", due: "20 May 2026", status: "overdue",  overdueBy: 3, sareeType: "Bridal Special · BS-004",   design: "BKB-019", done: 18, total: 25, shortage: 7,  paymentStatus: "partial", amountDue: 350000, amountPaid: 200000 },
  { customer: "Meenakshi Silks",        ref: "ORD-2026-029", due: "05 Jun 2026", status: "on-track",              sareeType: "Self Brocade · SB-001",    design: "BKB-038", done: 15, total: 40,              paymentStatus: "pending", amountDue: 120000, amountPaid: 0 },
  { customer: "Kalavathi Exports",      ref: "ORD-2026-027", due: "02 Jun 2026", status: "on-track",              sareeType: "Heavy Zari · HZ-003",      design: "BKB-045", done: 8,  total: 35,              paymentStatus: "partial", amountDue: 450000, amountPaid: 100000 },
];

export const ORDER_CFG: Record<OrderStatus, {
  strip: string; badgeBg: string; badgeColor: string;
  PhIcon: React.ElementType; iconBg: string; iconColor: string;
  barColor: string;
}> = {
  "on-track": { strip: T.green,       badgeBg: "rgba(30,102,64,0.10)",   badgeColor: T.green,       PhIcon: CheckCircle,   iconBg: "rgba(30,102,64,0.12)",   iconColor: T.green,       barColor: T.green       },
  "at-risk":  { strip: T.antiqueGold, badgeBg: "rgba(200,155,71,0.12)", badgeColor: "#8B6018",     PhIcon: WarningCircle, iconBg: "rgba(200,155,71,0.12)",  iconColor: T.antiqueGold, barColor: T.antiqueGold },
  "overdue":  { strip: T.crimson,     badgeBg: "rgba(192,57,43,0.10)",  badgeColor: T.crimson,     PhIcon: XCircle,       iconBg: "rgba(192,57,43,0.10)",   iconColor: T.crimson,     barColor: T.crimson     },
};

export const STATUS_LABELS: Record<OrderStatus, (o: BulkOrder) => string> = {
  "on-track": () => "On Track",
  "at-risk":  o => `At Risk — ${o.daysLeft} day${o.daysLeft === 1 ? "" : "s"} left`,
  "overdue":  o => `Past Deadline — ${o.overdueBy} day${o.overdueBy === 1 ? "" : "s"} overdue`,
};

// ─── SECTION 4 — Active batches ─────────────────────────────────────────────────
export const STAGE_CFG: Record<BatchStage, { label: string; border: string; badgeBg: string; badgeColor: string }> = {
  "weaving":   { label: "Weaving in Progress",                        border: "#C4923A", badgeBg: "rgba(196,146,58,0.12)", badgeColor: "#8B6018" },
  "submitted": { label: "Sarees Submitted — Waiting Quality Check",   border: T.blueGray, badgeBg: "rgba(74,107,138,0.10)", badgeColor: T.blueGray },
  "qc-passed": { label: "Quality Check Passed — Moved to Stock",      border: T.green,   badgeBg: "rgba(30,102,64,0.10)", badgeColor: T.green   },
  "finishing": { label: "In Stock — Ready for Sale",                  border: T.green,   badgeBg: "rgba(30,102,64,0.10)", badgeColor: T.green   },
};

export const FILTER_PILLS: { label: string; stage: BatchStage | null }[] = [
  { label: "All Batches",                             stage: null          },
  { label: "Material Issued — Weaving in Progress",   stage: "weaving"     },
  { label: "Sarees Submitted",                        stage: "submitted"   },
  { label: "Quality Check Passed",                    stage: "qc-passed"   },
  { label: "In Stock — Ready for Sale",               stage: "finishing"   },
];

export const BATCHES: Batch[] = [
  { id: "BATCH-089", stage: "weaving",   sareeCode: "SB-001", sareeTypeName: "Self Brocade",   rate: 450,  design: "BKB-045", designName: "Cream Zari Border",    weavers: [{ name: "Ravi Kumar",   id: "WV-001", initials: "RK", bg: T.royalBurgundy }], materials: "Warp: 6 kg · Resham: Red 800g, Gold 400g · Jari: PLY-2G-Gold 250g",         started: "20 May 2026", expected: "28 May 2026",                       done: 4, total: 8                      },
  { id: "BATCH-086", stage: "weaving",   sareeCode: "HZ-003", sareeTypeName: "Heavy Zari",     rate: 680,  design: "BKB-031", designName: "Maroon Heavy Border",   weavers: [{ name: "Padma Veni",   id: "WV-002", initials: "PV", bg: "#C4923A"       }], materials: "Warp: 4.5 kg · Resham: Maroon 600g, Gold 300g · Jari: SF-3G-Gold 300g",   started: "18 May 2026", expected: "26 May 2026",                       done: 3, total: 5                      },
  { id: "BATCH-081", stage: "submitted", sareeCode: "PS-002", sareeTypeName: "Plain Silk",     rate: 280,  design: "BKB-022", designName: "Cream Plain Silk",      weavers: [{ name: "Suresh Murti", id: "WV-007", initials: "SM", bg: T.taupe         }], materials: "Warp: 3 kg · Resham: Cream 500g · Jari: PLY-1G-Silver 150g",               started: "12 May 2026", submitted: "20 May 2026",                      done: 4, total: 4                      },
  { id: "BATCH-083", stage: "weaving",   sareeCode: "BS-004", sareeTypeName: "Bridal Special", rate: 1200, design: "BKB-019", designName: "Red Bridal Zari",       weavers: [{ name: "Anand K.",     id: "WV-005", initials: "AK", bg: T.deepWine      }, { name: "Meena R.", id: "WV-012", initials: "MR", bg: "#A05080" }], materials: "Warp: 8.5 kg · Resham: Red 1.2 kg, Gold 600g · Jari: SF-5G-Gold 500g", started: "15 May 2026", expected: "30 May 2026",                       done: 5, total: 10                     },
  { id: "BATCH-085", stage: "weaving",   sareeCode: "SB-001", sareeTypeName: "Self Brocade",   rate: 450,  design: "BKB-038", designName: "Blue Zari Checks",      weavers: [{ name: "Meena R.",     id: "WV-012", initials: "MR", bg: "#A05080"       }], materials: "Warp: 3.5 kg · Resham: Blue 400g, Green 300g · Jari: PLY-3G-Gold 180g",  started: "14 May 2026", expected: "22 May 2026", late: 2,               done: 1, total: 4                      },
  { id: "BATCH-079", stage: "qc-passed", sareeCode: "HZ-003", sareeTypeName: "Heavy Zari",     rate: 680,  design: "BKB-045", designName: "Cream Zari Border",    weavers: [{ name: "Kamala B.",    id: "WV-031", initials: "KB", bg: T.darkBurgundy  }], materials: "Warp: 4 kg · Resham: Cream 600g, Gold 300g · Jari: SF-2G-Gold 250g",      started: "05 May 2026", expected: "15 May 2026",                       done: 6, total: 6, qcPassed: 6  },
  { id: "BATCH-077", stage: "qc-passed", sareeCode: "PS-002", sareeTypeName: "Plain Silk",     rate: 280,  design: "BKB-022", designName: "Cream Plain Silk",      weavers: [{ name: "Venkat Rao",   id: "WV-024", initials: "VR", bg: T.green         }], materials: "Warp: 3.5 kg · Resham: Cream 600g · Jari: PLY-1G-Silver 180g",            started: "03 May 2026", expected: "13 May 2026",                       done: 8, total: 8, qcPassed: 7  },
  { id: "BATCH-093", stage: "finishing", sareeCode: "BS-004", sareeTypeName: "Bridal Special", rate: 1200, design: "BKB-019", designName: "Red Bridal Zari",       weavers: [{ name: "Lakshmi D.",   id: "WV-018", initials: "LD", bg: "#C4923A"       }], materials: "Warp: 5 kg · Resham: Red 800g, Gold 400g · Jari: SF-4G-Gold 350g",        started: "08 May 2026", expected: "18 May 2026",                       done: 5, total: 5, qcPassed: 5, finishingDone: 3 },
];

export const VIEW_OPTIONS = [
  { key: "card",  label: "Card View",  Icon: SquaresFour },
  { key: "list",  label: "List View",  Icon: ListDashes },
  { key: "table", label: "Table View", Icon: PhList },
];

// ─── Defective sarees ───────────────────────────────────────────────────────────
export const DEFECTIVE_DATA = [
  { id: "PADMA-L1-004",  weaver: "Padma Veni",      batch: "BATCH-086", design: "BKB-045", sareeType: "Self Brocade", defects: ["Thread Break"],              qcDate: "11 Jun 2026", deduction: "₹450" },
  { id: "RAVI-L2-008",   weaver: "Ravi Kumar",       batch: "BATCH-089", design: "BKB-031", sareeType: "Heavy Zari",   defects: ["Design Error"],              qcDate: "10 Jun 2026", deduction: "₹680" },
  { id: "BKB-L3-002",    weaver: "Own Factory L3",   batch: "BATCH-OWN", design: "BKB-022", sareeType: "Plain Silk",   defects: ["Weight Problem"],            qcDate: "10 Jun 2026", deduction: "₹280" },
  { id: "SURESH-L2-003", weaver: "Suresh Murti",     batch: "BATCH-081", design: "BKB-038", sareeType: "Self Brocade", defects: ["Jari Issue"],                qcDate: "09 Jun 2026", deduction: "₹450" },
  { id: "PADMA-L1-003",  weaver: "Padma Veni",       batch: "BATCH-086", design: "BKB-045", sareeType: "Self Brocade", defects: ["Thread Break"],              qcDate: "09 Jun 2026", deduction: "₹450" },
];

// ─── Analytics ────────────────────────────────────────────────────────────────
export const WEEKLY_DATA = [
  { week: "W1", produced: 58, dispatched: 45 },
  { week: "W2", produced: 64, dispatched: 50 },
  { week: "W3", produced: 72, dispatched: 55 },
  { week: "W4", produced: 54, dispatched: 42 },
];
export const STAGE_FUNNEL = [
  { label: "Weaving in Progress",    count: 14, color: "#845E04",    widthPct: 100 },
  { label: "Submitted — Waiting QC", count: 5,  color: T.blueGray,   widthPct: 62  },
  { label: "Quality Check Passed",   count: 3,  color: T.green,      widthPct: 42  },
  { label: "In Stock — Ready for Sale", count: 2,  color: T.green, widthPct: 26  },
];
export const TOP_WEAVERS_CHART = [
  { name: "Padma Veni",   initials: "PV", bg: "#C4923A",       sarees: 18 },
  { name: "Kamala B.",    initials: "KB", bg: T.darkBurgundy,  sarees: 14 },
  { name: "Ravi Kumar",   initials: "RK", bg: T.royalBurgundy, sarees: 12 },
  { name: "Lakshmi D.",   initials: "LD", bg: "#A0506A",       sarees: 11 },
  { name: "Suresh Murti", initials: "SM", bg: T.taupe,         sarees: 7  },
];
export const ORDER_PROGRESS = [
  { name: "Lakshmi Silks",          done: 76, total: 80 },
  { name: "Vijaya Silk House",       done: 28, total: 30 },
  { name: "Padmavathi Textiles",     done: 42, total: 60 },
  { name: "Narayana Silk Emporium",  done: 18, total: 25 },
  { name: "Meenakshi Silks",         done: 15, total: 40 },
  { name: "Kalavathi Exports",       done: 8,  total: 35 },
];
export const ANALYTICS_PERIODS = ["This Week", "This Month", "Last 3 Months", "This Year"];

// ─── Production history ─────────────────────────────────────────────────────────
export const HISTORY_BATCHES: HistoryBatch[] = [
  { id: "BATCH-448", designCode: "808-048", sareeType: "Self Brocade 336 ORS", batchSize: 4, weavers: [{ initials: "PV", bg: "#7C3AED" }, { initials: "RK", bg: T.royalBurgundy }], completion: 5, allPieces: 5, okPieces: 0,    found: 0,    status: "Printing Completed",    makingCharges: "₹1,25,000", completedOn: "30 May 2025", bulkOrder: "BO-12" },
  { id: "BATCH-476", designCode: "808-048", sareeType: "Self Brocade 282 ORS", batchSize: 4, weavers: [{ initials: "SM", bg: T.taupe },    { initials: "AK", bg: "#B45309"       }], completion: 4, allPieces: 4, okPieces: 0,    found: 0,    status: "Printing Completed",    makingCharges: "₹1,25,000", completedOn: "30 May 2025" },
  { id: "BATCH-074", designCode: "808-048", sareeType: "Stripe Space 082 ORS", batchSize: 4, weavers: [{ initials: "PV", bg: "#7C3AED" }, { initials: "SM", bg: T.taupe          }], completion: 4, allPieces: 4, okPieces: 2,    found: 1,    status: "Printing In Process",   makingCharges: "₹75,000",   completedOn: "02 Apr 2025" },
  { id: "BATCH-081", designCode: "808-088", sareeType: "Heavy Zari 741 ORS",   batchSize: 4, weavers: [{ initials: "RK", bg: T.royalBurgundy }, { initials: "AK", bg: "#B45309"  }], completion: 5, allPieces: 5, okPieces: 0,    found: 1,    status: "Challenge in Progress", makingCharges: "₹1,50,000", completedOn: "04 May 2025" },
  { id: "BATCH-147", designCode: "808-048", sareeType: "Heavy Zari 741 ORS",   batchSize: 2, weavers: [{ initials: "PV", bg: "#7C3AED" }, { initials: "RK", bg: T.royalBurgundy }], completion: 2, allPieces: 2, okPieces: 1,    found: 1,    status: "Challenge in Progress", makingCharges: "₹30,000",   completedOn: "15 May 2025" },
  { id: "BATCH-148", designCode: "808-088", sareeType: "Plane 344 ORS",         batchSize: 4, weavers: [{ initials: "SM", bg: T.taupe },    { initials: "AK", bg: "#B45309"       }], completion: 3, allPieces: 3, okPieces: 0,    found: 1,    status: "Challenge in Progress", makingCharges: "₹80,000",   completedOn: "25 Apr 2025" },
  { id: "BATCH-167", designCode: "808-048", sareeType: "Heavy Zari 741 ORS",   batchSize: 4, weavers: [{ initials: "PV", bg: "#7C3AED" }, { initials: "SM", bg: T.taupe          }], completion: 3, allPieces: 3, okPieces: 1,    found: 1,    status: "Challenge in Progress", makingCharges: "₹80,000",   completedOn: "11 May 2025" },
  { id: "BATCH-179", designCode: "808-048", sareeType: "Stripe Space 082 ORS", batchSize: 4, weavers: [{ initials: "RK", bg: T.royalBurgundy }, { initials: "AK", bg: "#B45309"  }], completion: 3, allPieces: 3, okPieces: null, found: null, status: "Printing Completed",    makingCharges: "₹80,000",   completedOn: "25 Apr 2025" },
  { id: "BATCH-354", designCode: "808-048", sareeType: "Happy Zari 741 ORS",   batchSize: 2, weavers: [{ initials: "PV", bg: "#7C3AED" }, { initials: "RK", bg: T.royalBurgundy }], completion: 2, allPieces: 2, okPieces: null, found: null, status: "Challenge in Progress", makingCharges: "₹80,000",   completedOn: "07 Apr 2025" },
  { id: "BATCH-304", designCode: "808-048", sareeType: "Stripe Space 082 ORS", batchSize: 2, weavers: [{ initials: "SM", bg: T.taupe },    { initials: "AK", bg: "#B45309"       }], completion: 2, allPieces: 2, okPieces: null, found: null, status: "Challenge in Progress", makingCharges: "₹80,000",   completedOn: "07 Apr 2025" },
];
