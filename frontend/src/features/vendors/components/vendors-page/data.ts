import { T } from "./theme";

export const PAYMENT_TERMS = ["30 days", "15 days", "45 days", "60 days", "90 days", "Advance"];
export const STATES = ["Andhra Pradesh", "Telangana", "Tamil Nadu", "Karnataka", "Gujarat", "Uttar Pradesh", "Maharashtra", "Kerala"];
export const MATERIAL_TYPES = ["All Types", "Warp", "Resham", "Jari", "Warp / Resham", "Resham / Warp"];
export const MATERIAL_FILL: Record<string, string> = { Warp: T.royalBurgundy, Resham: T.antiqueGold, Jari: T.green };

// GAP: on-time-delivery % and quality-reject % per vendor cannot be computed
// from real data today. PurchaseOrder has `deliveryDate` (expected) but no
// actual-received timestamp — `grnId` set on receive is a freshly generated
// display string (see purchase-orders.service.ts#receiveGrn), not a foreign
// key to GrnReceipt, so PO cannot be joined to a GRN's real `receivedDate`.
// Separately, neither GrnReceipt nor GrnItem (backend/prisma/schema.prisma)
// carries any rejected-quantity/quality field. There is nothing to
// aggregate, so this metric was removed rather than faked — see
// VendorAnalyticsSection.tsx's "Delivery Reliability" card for the honest
// not-tracked state. (Previously this was a `DELIVERY_PERF` map keyed to
// fake ids like "VEN-001", which never matched real vendor UUIDs anyway —
// every real vendor was silently falling back to the same flat mock numbers.)
export const MAT_TAG_PO: Record<string, { col: string; bg: string }> = {
  Warp:   { col: T.royalBurgundy, bg: "rgba(110,15,45,0.09)"   },
  Resham: { col: "#7A5E1C",       bg: "rgba(200,155,71,0.13)"  },
  Jari:   { col: T.luxuryBrown,   bg: "rgba(59,35,20,0.09)"    },
};

// ── Vendor billing & payment ledger ────────────────────────────────────────
// Bills come from the vendor's purchase orders; payments settle them oldest
// first, leaving exactly the vendor's recorded `outstanding` unpaid — so the
// Order History, Payment History, and the directory card never disagree.

export const PAY_MODES = ["Bank Transfer", "NEFT", "RTGS", "UPI", "Cheque", "Cash"];
export const PAY_MODE_FILL: Record<string, string> = {
  "Bank Transfer": T.royalBurgundy, NEFT: "#8A2440", RTGS: T.antiqueGold,
  UPI: T.goldLight, Cheque: T.green, Cash: "#5A3E6B",
};
export const BILL_STATUS_CFG: Record<string, { bg: string; color: string }> = {
  Paid:    { bg: "rgba(30,102,64,0.10)",  color: T.greenMid },
  Partial: { bg: "rgba(200,155,71,0.13)", color: "#8B6018" },
  Pending: { bg: "rgba(74,107,138,0.10)", color: "#2E5A8A" },
  Overdue: { bg: "rgba(192,57,43,0.10)",  color: T.crimson },
};
