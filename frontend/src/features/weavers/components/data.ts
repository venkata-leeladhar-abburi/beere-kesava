// ── Cross-section mock data ────────────────────────────────────────────────
// MOCK-BACKED (partial): WEAVERS, TABLE_ROWS, LEADERBOARD, ACTIVITIES,
// BATCH_HISTORY, WARP_REQUESTS, HEADER_CHIPS, STATS, WEAVER_RATES remain
// static/empty mock scaffolding. They mix WV-XXX-style ids with
// production/QC/payments numbers that have no backend endpoint yet.
// WeaverDirectory (WeaverTableAndDirectory.tsx), PerformancePanel
// (leaderboard/PerformancePanel.tsx) and WeaverAnalytics.tsx have all been
// rewired to read live data from weaversApi (GET /weavers, GET
// /weavers/:id/stats, GET /weavers/leaderboard) instead of the arrays below
// — untangling identity from historical production/payments data here would
// still need either the WV-XXX-id migration or a real dated production
// ledger endpoint, both out of scope. Leave the remaining exports mock until
// batches/QC/payments are wired to real weaver ids.
import type React from "react";
import { Package, CheckCircle, WarningCircle, Medal, ChartBar, SquaresFour, List as PhList, Table as PhTable } from "@phosphor-icons/react";
import { imgPadmaVeni, imgRaviKumar, imgSureshMurti, imgAnandK } from "../../../shared/constants/weaverImages";
import { T } from "./theme";
import type { Status } from "./types";

export const WEAVER_RATES: Record<string, { code: string; type: string; rate: string }> = {
  "b5f9178c-b1b9-4871-a7c3-0d68a462d57a": { code: "SB-001", type: "Self Brocade", rate: "₹450/saree" },
  "8937070a-ea63-43f3-9cb4-dcbcfd362ff7": { code: "HZ-003", type: "Heavy Zari", rate: "₹680/saree" },
  "11278a51-a26d-4eaa-adbf-bedbfa7fdf46": { code: "SB-001", type: "Self Brocade", rate: "₹450/saree" },
  "71413724-378d-4336-93dd-1db33cba3510": { code: "PS-002", type: "Plain Silk", rate: "₹280/saree" },
  "95cc89ea-6cf3-418c-bf9b-299e59f47389": { code: "HZ-003", type: "Heavy Zari", rate: "₹680/saree" },
  "d3fd5a81-7d3a-478d-9a0f-d65a5db6779a": { code: "SB-001", type: "Self Brocade", rate: "₹450/saree" },
  "51490482-11cf-425b-8d54-7bd918f6db18": { code: "BS-004", type: "Bridal Special", rate: "₹820/saree" },
};

export const WEAVERS: any[] = [];
export type ImportedWeaver = typeof WEAVERS[0];
export const TABLE_ROWS: any[] = [];
export const LEADERBOARD: any[] = [];
export const QC_DATA = [
  { name: "Passed", value: 238, color: T.green },
  { name: "Rejected", value: 10, color: T.crimson },
];
// Each row is one thing that happened. `needsAction` marks the ones that sit
// in your queue rather than just being FYI — that's the distinction that was
// missing before: everything looked the same regardless of whether it wanted
// a decision from you or was just a record of something already finished.
export const ACTIVITIES: any[] = [];
export const BATCH_HISTORY: any[] = [];

export const HEADER_CHIPS = [
  { value: "0", label: "Active Weavers", crimson: false },
  { value: "0", label: "Sarees Produced This Month", crimson: false },
  { value: "0%", label: "Quality Check Pass Rate", crimson: false },
  { value: "0", label: "Warp Requests Pending", crimson: true },
  { value: "₹0", label: "Total Paid to Weavers This Month", crimson: false },
];

export const STATS = [
  { label: "TOTAL ACTIVE WEAVERS", value: "0", sub: "All currently working with the firm", gold: false, crimson: false },
  { label: "SAREES PRODUCED THIS MONTH", value: "0", sub: "This month", gold: false, crimson: false },
  { label: "QUALITY CHECK PASS RATE", value: "0%", sub: "Pass rate", gold: true, crimson: false },
  { label: "WARP REQUESTS PENDING", value: "0", sub: "Pending approval", gold: false, crimson: true },
  { label: "TOTAL PAID TO WEAVERS", value: "₹0", sub: "This month's making charges", gold: false, crimson: false },
];

export const WARP_REQUESTS: any[] = [];

export const FILTER_PILLS = ["All Weavers", "Currently Working", "Submitted — Waiting Quality Check", "Idle — No Active Batch"];
export const VIEW_OPTIONS = [
  { key: "card", label: "Cards", PhIcon: SquaresFour },
  { key: "list", label: "List", PhIcon: PhList },
  { key: "table", label: "Table", PhIcon: PhTable },
];

export const TABLE_COLS = ["Weaver Code", "Full Name", "Village / Area", "Mobile", "Looms", "Status", "Sarees This Month", "QC Pass Rate", "Total Sarees", "Total Paid", "Last Active", "Action"];

// NOTE: the old ANALYTICS_WEAVERS / PRODUCTION_LEDGER fabricated-history
// exports (which derived a fake monthly production ledger by seeding random
// wobble values off WEAVERS/TABLE_ROWS) have been removed. WeaverAnalytics.tsx
// now computes its aggregates directly from weaversApi (GET /weavers, GET
// /weavers/:id/stats) — see that file. A dated production ledger isn't
// exposed by the backend yet, so month-by-month trend charts are shown as a
// documented gap there instead of being invented.

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

