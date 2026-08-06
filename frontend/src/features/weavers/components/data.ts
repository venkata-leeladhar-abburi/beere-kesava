// ── Cross-section mock data ────────────────────────────────────────────────
// MOCK-BACKED: every export in this file (WEAVERS, TABLE_ROWS, LEADERBOARD,
// ACTIVITIES, BATCH_HISTORY, WARP_REQUESTS, ANALYTICS_WEAVERS,
// PRODUCTION_LEDGER, HEADER_CHIPS, STATS, WEAVER_RATES) remains static mock
// data. It mixes WV-XXX-style ids with production/QC/payments numbers that
// have no backend endpoint yet, and WeaversPage.tsx's directory/analytics/
// leaderboard sections read it directly — untangling identity from
// production here would mean either the WV-XXX-id migration or faking
// production stats for real weavers, both explicitly out of scope for the
// identity/roster wiring done in AllWeaversPage.tsx and NewWeaverModal.tsx.
// Leave this file mock until batches/QC/payments are wired to real weaver
// ids.
import type React from "react";
import { Package, CheckCircle, WarningCircle, Medal, ChartBar, SquaresFour, List as PhList, Table as PhTable } from "@phosphor-icons/react";
import { imgPadmaVeni, imgRaviKumar, imgSureshMurti, imgAnandK } from "../../../shared/constants/weaverImages";
import { T } from "./theme";
import type { Status, AnalyticsWeaver, ProductionRow } from "./types";

export const WEAVER_RATES: Record<string, { code: string; type: string; rate: string }> = {
  "b5f9178c-b1b9-4871-a7c3-0d68a462d57a": { code: "SB-001", type: "Self Brocade", rate: "₹450/saree" },
  "8937070a-ea63-43f3-9cb4-dcbcfd362ff7": { code: "HZ-003", type: "Heavy Zari", rate: "₹680/saree" },
  "11278a51-a26d-4eaa-adbf-bedbfa7fdf46": { code: "SB-001", type: "Self Brocade", rate: "₹450/saree" },
  "71413724-378d-4336-93dd-1db33cba3510": { code: "PS-002", type: "Plain Silk", rate: "₹280/saree" },
  "95cc89ea-6cf3-418c-bf9b-299e59f47389": { code: "HZ-003", type: "Heavy Zari", rate: "₹680/saree" },
  "d3fd5a81-7d3a-478d-9a0f-d65a5db6779a": { code: "SB-001", type: "Self Brocade", rate: "₹450/saree" },
  "51490482-11cf-425b-8d54-7bd918f6db18": { code: "BS-004", type: "Bridal Special", rate: "₹820/saree" },
};

export const WEAVERS = [
  { id: "b5f9178c-b1b9-4871-a7c3-0d68a462d57a", name: "Ravi Kumar", village: "Dharmavaram, AP", photo: imgRaviKumar, initials: "RK", bg: "#5A3E6B", status: "active" as Status, thisMonth: 12, passRate: 94, totalEver: 2140, looms: 3, batch: "BATCH-079", design: "BKB-042", mobile: "×××× 4521", totalPaid: "₹8,42,000", lastActive: "Today" },
  { id: "8937070a-ea63-43f3-9cb4-dcbcfd362ff7", name: "Padma Veni", village: "Pochampally, Telangana", photo: imgPadmaVeni, initials: "PV", bg: "#9B6B8A", status: "active" as Status, thisMonth: 18, passRate: 97, totalEver: 1840, looms: 2, batch: "BATCH-086", design: "BKB-051", mobile: "×××× 8834", totalPaid: "₹6,90,000", lastActive: "Today" },
  { id: "11278a51-a26d-4eaa-adbf-bedbfa7fdf46", name: "Suresh Murti", village: "Venkatagiri, AP", photo: imgSureshMurti, initials: "SM", bg: "#2D6B6B", status: "qc" as Status, thisMonth: 7, passRate: 98, totalEver: 980, looms: 2, batch: "BATCH-081", design: "BKB-040", mobile: "×××× 9982", totalPaid: "₹3,64,000", lastActive: "Yesterday" },
  { id: "71413724-378d-4336-93dd-1db33cba3510", name: "Anand K.", village: "Pochampally, Telangana", photo: imgAnandK, initials: "AK", bg: "#4A6B4A", status: "active" as Status, thisMonth: 9, passRate: 92, totalEver: 1560, looms: 2, batch: "BATCH-083", design: "BKB-047", mobile: "×××× 7723", totalPaid: "₹5,84,000", lastActive: "Today" },
  { id: "95cc89ea-6cf3-418c-bf9b-299e59f47389", name: "Meena R.", village: "Siddipet, Telangana", photo: null, initials: "MR", bg: "#9B6B8A", status: "active" as Status, thisMonth: 6, passRate: 89, totalEver: 720, looms: 1, batch: "BATCH-088", design: "BKB-033", mobile: "×××× 6614", totalPaid: "₹2,68,000", lastActive: "Today" },
  { id: "d3fd5a81-7d3a-478d-9a0f-d65a5db6779a", name: "Lakshmi D.", village: "Dharmavaram, AP", photo: null, initials: "LD", bg: "#2D7D6B", status: "qc" as Status, thisMonth: 11, passRate: 96, totalEver: 1320, looms: 2, batch: "BATCH-080", design: "BKB-040", mobile: "×××× 3341", totalPaid: "₹4,92,000", lastActive: "Yesterday" },
  { id: "c7d8e833-dcd7-4a52-a867-f77d8ca2e1cf", name: "Venkat Rao", village: "Venkatagiri, AP", photo: null, initials: "VR", bg: "#4A5E7A", status: "idle" as Status, thisMonth: 0, passRate: 95, totalEver: 2480, looms: 4, batch: null, design: null, mobile: "×××× 1122", totalPaid: "₹9,28,000", lastActive: "3 days ago" },
  { id: "51490482-11cf-425b-8d54-7bd918f6db18", name: "Kamala B.", village: "Pochampally, Telangana", photo: null, initials: "KB", bg: "#7A2040", status: "active" as Status, thisMonth: 14, passRate: 99, totalEver: 3120, looms: 3, batch: "BATCH-084", design: "BKB-055", mobile: "×××× 5589", totalPaid: "₹11,64,000", lastActive: "Today" },
];
/** Element type of WEAVERS — lives here, not in types.ts, to avoid a
 *  data.ts <-> types.ts circular import. */
export type ImportedWeaver = typeof WEAVERS[0];
export const TABLE_ROWS = [
  { id: "b5f9178c-b1b9-4871-a7c3-0d68a462d57a", name: "Ravi Kumar", village: "Dharmavaram, AP", mobile: "×××× 4521", looms: 3, status: "active" as Status, thisMonth: 12, passRate: 94, totalEver: "2,140", totalPaid: "₹8,42,000", lastActive: "Today" },
  { id: "8937070a-ea63-43f3-9cb4-dcbcfd362ff7", name: "Padma Veni", village: "Pochampally, TG", mobile: "×××× 8834", looms: 2, status: "active" as Status, thisMonth: 18, passRate: 97, totalEver: "1,840", totalPaid: "₹6,90,000", lastActive: "Today" },
  { id: "a1bb101d-f0ee-4f65-b2f7-a7a86c24129f", name: "Krishnamma", village: "Venkatagiri, AP", mobile: "×××× 2210", looms: 2, status: "idle" as Status, thisMonth: 0, passRate: 96, totalEver: "2,640", totalPaid: "₹9,84,000", lastActive: "3 days ago" },
  { id: "0b509a71-5efa-495e-baa3-e010541548da", name: "Rajesh T.", village: "Siddipet, TG", mobile: "×××× 5567", looms: 1, status: "active" as Status, thisMonth: 5, passRate: 91, totalEver: "620", totalPaid: "₹2,18,000", lastActive: "Today" },
  { id: "71413724-378d-4336-93dd-1db33cba3510", name: "Anand K.", village: "Pochampally, TG", mobile: "×××× 7723", looms: 2, status: "active" as Status, thisMonth: 9, passRate: 92, totalEver: "1,560", totalPaid: "₹5,84,000", lastActive: "Today" },
  { id: "c5122ba3-c872-41d6-aaa7-2ea01df5a1dc", name: "Saraswati M.", village: "Dharmavaram, AP", mobile: "×××× 3341", looms: 3, status: "qc" as Status, thisMonth: 11, passRate: 98, totalEver: "3,240", totalPaid: "₹12,40,000", lastActive: "Yesterday" },
  { id: "11278a51-a26d-4eaa-adbf-bedbfa7fdf46", name: "Suresh Murti", village: "Venkatagiri, AP", mobile: "×××× 9982", looms: 2, status: "qc" as Status, thisMonth: 7, passRate: 98, totalEver: "980", totalPaid: "₹3,64,000", lastActive: "Yesterday" },
  { id: "79334303-940b-40ec-a418-eb0ce280132c", name: "Bhavani K.", village: "Siddipet, TG", mobile: "×××× 6614", looms: 1, status: "idle" as Status, thisMonth: 0, passRate: 88, totalEver: "440", totalPaid: "₹1,60,000", lastActive: "5 days ago" },
];
export const LEADERBOARD = [
  { rank: 1, name: "Padma Veni", id: "8937070a-ea63-43f3-9cb4-dcbcfd362ff7", sarees: 18, rate: 97, photo: imgPadmaVeni, initials: "PV", bg: "#9B6B8A" },
  { rank: 2, name: "Kamala B.", id: "51490482-11cf-425b-8d54-7bd918f6db18", sarees: 14, rate: 99, photo: null, initials: "KB", bg: "#7A2040" },
  { rank: 3, name: "Ravi Kumar", id: "b5f9178c-b1b9-4871-a7c3-0d68a462d57a", sarees: 12, rate: 94, photo: imgRaviKumar, initials: "RK", bg: "#5A3E6B" },
  { rank: 4, name: "Lakshmi D.", id: "d3fd5a81-7d3a-478d-9a0f-d65a5db6779a", sarees: 11, rate: 96, photo: null, initials: "LD", bg: "#2D7D6B" },
  { rank: 5, name: "Suresh Murti", id: "11278a51-a26d-4eaa-adbf-bedbfa7fdf46", sarees: 7, rate: 98, photo: imgSureshMurti, initials: "SM", bg: "#2D6B6B" },
];
export const QC_DATA = [
  { name: "Passed", value: 238, color: T.green },
  { name: "Rejected", value: 10, color: T.crimson },
];
// Each row is one thing that happened. `needsAction` marks the ones that sit
// in your queue rather than just being FYI — that's the distinction that was
// missing before: everything looked the same regardless of whether it wanted
// a decision from you or was just a record of something already finished.
export const ACTIVITIES = [
  { icon: "⚠️", category: "Material", action: "Material request pending", detail: "Suresh Murti (11278a51-a26d-4eaa-adbf-bedbfa7fdf46) requested 4 kg Warp — awaiting your approval", time: "Today", needsAction: true, weaverId: "11278a51-a26d-4eaa-adbf-bedbfa7fdf46" },
  { icon: "✅", category: "Quality Check", action: "Quality check submitted", detail: "Padma Veni (8937070a-ea63-43f3-9cb4-dcbcfd362ff7) submitted 18 sarees — 17 passed, 1 rejected", time: "Yesterday", needsAction: false, weaverId: "8937070a-ea63-43f3-9cb4-dcbcfd362ff7" },
  { icon: "📦", category: "Batch", action: "New batch issued", detail: "BATCH-089 given to Ravi Kumar (b5f9178c-b1b9-4871-a7c3-0d68a462d57a) — extra sarees for the Lakshmi Silks order", time: "2 hours ago", needsAction: false, weaverId: "b5f9178c-b1b9-4871-a7c3-0d68a462d57a" },
  { icon: "🔄", category: "Batch", action: "Batch completed", detail: "Kamala B. (51490482-11cf-425b-8d54-7bd918f6db18) completed BATCH-084 — 14 sarees woven, all passed quality check", time: "3 days ago", needsAction: false, weaverId: "51490482-11cf-425b-8d54-7bd918f6db18" },
  { icon: "💰", category: "Payment", action: "Payment processed", detail: "Monthly making charges disbursed to 84 weavers — ₹4.2L total paid this month", time: "2 days ago", needsAction: false },
];
export const BATCH_HISTORY = [
  { batch: "BATCH-072", design: "BKB-040", produced: 6, passed: 6, date: "15 Apr 2026" },
  { batch: "BATCH-061", design: "BKB-022", produced: 5, passed: 4, date: "02 Apr 2026" },
  { batch: "BATCH-054", design: "BKB-045", produced: 7, passed: 7, date: "18 Mar 2026" },
  { batch: "BATCH-047", design: "BKB-031", produced: 6, passed: 5, date: "04 Mar 2026" },
  { batch: "BATCH-039", design: "BKB-019", produced: 5, passed: 5, date: "14 Feb 2026" },
];

export const HEADER_CHIPS = [
  { value: "9",     label: "Active Weavers",                      crimson: false },
  { value: "248",   label: "Sarees Produced This Month",          crimson: false },
  { value: "96%",   label: "Quality Check Pass Rate",             crimson: false },
  { value: "3",     label: "Warp Requests Pending",               crimson: true  },
  { value: "₹4.2L", label: "Total Paid to Weavers This Month",    crimson: false },
];

export const STATS = [
  { label: "TOTAL ACTIVE WEAVERS", value: "9", sub: "All currently working with the firm", gold: false, crimson: false },
  { label: "SAREES PRODUCED THIS MONTH", value: "248", sub: "↑ 14% more than last month", gold: false, crimson: false },
  { label: "QUALITY CHECK PASS RATE", value: "96%", sub: "Only 4% rejected this month", gold: true, crimson: false },
  { label: "WARP REQUESTS PENDING", value: "3", sub: "⚠ Need approval today", gold: false, crimson: true },
  { label: "TOTAL PAID TO WEAVERS", value: "₹4.2L", sub: "This month's making charges", gold: false, crimson: false },
];

export const WARP_REQUESTS = [
  { name: "Ravi Kumar", code: "b5f9178c-b1b9-4871-a7c3-0d68a462d57a", batch: "BATCH-089", photo: imgRaviKumar, raised: "2 days ago", material: "3 kg Warp", reason: "Extra sarees for Lakshmi Silks order", done: 4, total: 8, pct: 50 },
  { name: "Padma Veni", code: "8937070a-ea63-43f3-9cb4-dcbcfd362ff7", batch: "BATCH-086", photo: imgPadmaVeni, raised: "1 day ago", material: "2 kg Warp + Resham Red 500g", reason: "Design change by admin", done: 3, total: 5, pct: 60 },
  { name: "Suresh Murti", code: "11278a51-a26d-4eaa-adbf-bedbfa7fdf46", batch: "BATCH-081", photo: imgSureshMurti, raised: "Today", material: "4 kg Warp", reason: "More sarees for stock", done: 2, total: 4, pct: 50 },
];

export const FILTER_PILLS = ["All Weavers", "Currently Working", "Submitted — Waiting Quality Check", "Idle — No Active Batch"];
export const VIEW_OPTIONS = [
  { key: "card", label: "Cards", PhIcon: SquaresFour },
  { key: "list", label: "List", PhIcon: PhList },
  { key: "table", label: "Table", PhIcon: PhTable },
];

export const TABLE_COLS = ["Weaver Code", "Full Name", "Village / Area", "Mobile", "Looms", "Status", "Sarees This Month", "QC Pass Rate", "Total Sarees", "Total Paid", "Last Active", "Action"];

export const ANALYTICS_WEAVERS: AnalyticsWeaver[] = (() => {
  const toNum = (s: string | number) => typeof s === "number" ? s : parseFloat(String(s).replace(/[₹,]/g, "")) || 0;
  const byId = new Map<string, AnalyticsWeaver>();
  const add = (w: any) => {
    if (byId.has(w.id)) return;
    const village: string = w.village;
    byId.set(w.id, {
      id: w.id, name: w.name, village,
      cluster: village.split(",")[0].trim(),
      looms: w.looms, status: w.status, thisMonth: w.thisMonth, passRate: w.passRate,
      totalEver: toNum(w.totalEver), totalPaid: toNum(w.totalPaid),
      photo: w.photo ?? null,
      initials: w.initials ?? w.name.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase(),
      bg: w.bg ?? "#5A3E6B",
    });
  };
  WEAVERS.forEach(add);
  TABLE_ROWS.forEach(add);
  return [...byId.values()];
})();

export const WA_MONTHS = 18;
export const WA_END = new Date(2026, 4, 31); // May 2026 — the "this month" the page reports on
export const WA_MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Monthly production history, seeded per weaver so the numbers are stable
// across renders and the current month matches the weaver's `thisMonth`.
export const PRODUCTION_LEDGER: ProductionRow[] = (() => {
  const rows: ProductionRow[] = [];
  ANALYTICS_WEAVERS.forEach(w => {
    const seed = w.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const base = w.thisMonth > 0 ? w.thisMonth : Math.max(3, Math.round(w.totalEver / 300));
    const ratePerSaree = w.totalEver ? w.totalPaid / w.totalEver : 450;
    for (let i = 0; i < WA_MONTHS; i++) {
      const d = new Date(WA_END.getFullYear(), WA_END.getMonth() - i, 15);
      // i === 0 is the current month: report the weaver's actual figure.
      const wobble = 0.65 + (Math.sin((i + 1) * 7.233 + seed) * 0.5 + 0.5) * 0.7;
      const produced = i === 0 ? w.thisMonth : Math.max(0, Math.round(base * wobble));
      const passed = Math.round(produced * (w.passRate / 100));
      rows.push({
        weaverId: w.id,
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-15`,
        produced, passed,
        payout: Math.round(passed * ratePerSaree),
      });
    }
  });
  return rows;
})();


export const STATUS_MIX_META: Record<Status, { label: string; color: string }> = {
  active: { label: "Currently Weaving", color: T.green },
  qc: { label: "Awaiting Quality Check", color: T.antiqueGold },
  idle: { label: "No Active Batch", color: T.taupe },
};
export const CLUSTER_FILLS = [T.royalBurgundy, T.antiqueGold, T.green, "#5A3E6B", "#2D6B6B", "#8A2440"];

export const ACTIVITY_ICONS: Record<string, { PhIcon: React.ElementType; bg: string; color: string }> = {
  "📦": { PhIcon: Package, bg: "rgba(200,155,71,0.10)", color: T.antiqueGold },
  "✅": { PhIcon: CheckCircle, bg: "rgba(30,102,64,0.10)", color: T.green },
  "⚠️": { PhIcon: WarningCircle, bg: "rgba(192,57,43,0.09)", color: T.crimson },
  "💰": { PhIcon: Medal, bg: "rgba(110,15,45,0.07)", color: T.royalBurgundy },
  "🔄": { PhIcon: ChartBar, bg: "rgba(110,15,45,0.07)", color: T.royalBurgundy },
};

