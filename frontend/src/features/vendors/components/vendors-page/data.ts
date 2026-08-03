import { T, MONTH_ABBR } from "./theme";
import { Vendor, PurchaseTxn, VendorBill, VendorPaymentTxn } from "./types";

export const INITIAL_VENDORS: Vendor[] = [
  { id: "VEN-001", name: "Sri Venkateswara Textiles", initials: "SV", contactName: "Ravi Kumar", phone: "+91 94440 12345", whatsapp: "+91 94440 12345", city: "Ongole", state: "Andhra Pradesh", address: "12, Trunk Road, Ongole, Andhra Pradesh - 523001", gstCode: "37AAACS1234F1Z1", type: "Warp", terms: "Net 30", bankName: "SBI", accountNo: "31234567890", notes: "Reliable supplier since 2018. Provides premium quality warp yarn.", status: "active", totalOrders: 34, totalSpend: "18,40,000", outstanding: "0", lastOrder: "15 Jun 2026", rating: 5 },
  { id: "VEN-002", name: "Lakshmi Thread House", initials: "LT", contactName: "Suresh Babu", phone: "+91 98888 22222", whatsapp: "+91 98888 22222", city: "Chennai", state: "Tamil Nadu", address: "82, Pondy Bazaar, T. Nagar, Chennai, Tamil Nadu - 600017", gstCode: "33AABCL4444G1Z2", type: "Warp / Resham", terms: "Net 15", bankName: "HDFC", accountNo: "09876543210", notes: "Specialises in fine grade warp and resham. Quick turnaround.", status: "active", totalOrders: 28, totalSpend: "12,60,000", outstanding: "0", lastOrder: "20 Jun 2026", rating: 4 },
  { id: "VEN-003", name: "Kanchipuram Silks", initials: "KS", contactName: "Murugan R.", phone: "+91 99999 55555", city: "Kanchipuram", state: "Tamil Nadu", address: "15, Gandhi Road, Kanchipuram, Tamil Nadu - 631501", gstCode: "33BBBBK5555H1Z3", type: "Resham", terms: "Net 45", bankName: "Canara Bank", accountNo: "11223344556", notes: "Premium silk resham. Preferred vendor for high-end designs.", status: "overdue", totalOrders: 19, totalSpend: "9,80,000", outstanding: "2,20,000", lastOrder: "02 May 2026", rating: 4 },
  { id: "VEN-004", name: "Mysore Silk Co.", initials: "MS", contactName: "Anand Prakash", phone: "+91 91111 33333", city: "Mysore", state: "Karnataka", address: "44, MG Road, Mysore, Karnataka - 570001", gstCode: "29CCCCM3333I1Z4", type: "Resham / Warp", terms: "Net 30", bankName: "ICICI", accountNo: "65432198765", notes: "Heritage supplier. Supplies both resham and warp at bulk rates.", status: "active", totalOrders: 22, totalSpend: "14,50,000", outstanding: "0", lastOrder: "10 Jun 2026", rating: 5 },
  { id: "VEN-005", name: "Surat Zari Works", initials: "SZ", contactName: "Hardik Shah", phone: "+91 93333 77777", whatsapp: "+91 93333 77777", city: "Surat", state: "Gujarat", address: "102, Ring Road, Surat, Gujarat - 395002", gstCode: "24DDDDZ7777J1Z5", type: "Jari", terms: "Net 60", bankName: "Axis Bank", accountNo: "98765432101", notes: "Best quality Jari in the market. Occasional delays during festive season.", status: "active", totalOrders: 15, totalSpend: "11,20,000", outstanding: "0", lastOrder: "28 May 2026", rating: 4 },
  { id: "VEN-006", name: "Varanasi Zari House", initials: "VZ", contactName: "Rakesh Tiwari", phone: "+91 95555 99999", city: "Varanasi", state: "Uttar Pradesh", address: "55, Dashashwamedh Ghat Road, Varanasi, UP - 221001", gstCode: "09EEEEV9999K1Z6", type: "Jari", terms: "Advance", bankName: "PNB", accountNo: "44556677889", notes: "Traditional Banarasi Jari. Advance payment required. Best quality.", status: "inactive", totalOrders: 8, totalSpend: "6,80,000", outstanding: "0", lastOrder: "4 months ago", rating: 3 },
];

export const PAYMENT_TERMS = ["30 days", "15 days", "45 days", "60 days", "90 days", "Advance"];
export const STATES = ["Andhra Pradesh", "Telangana", "Tamil Nadu", "Karnataka", "Gujarat", "Uttar Pradesh", "Maharashtra", "Kerala"];
export const MATERIAL_TYPES = ["All Types", "Warp", "Resham", "Jari", "Warp / Resham", "Resham / Warp"];
// ── Purchase ledger ────────────────────────────────────────────────────────
// Every analytic on this page reads the ledger, so the date filter applies to
// all of them at once. Each vendor's POs are spread across the trailing 18
// months and then normalised so the "All Time" totals match the vendor cards.
const LEDGER_END = new Date(2026, 5, 30); // Jun 2026
const LEDGER_MONTHS = 18;

export function buildLedger(list: { id: string; type: string; totalSpend: string; totalOrders: number }[]): PurchaseTxn[] {
  const rows: PurchaseTxn[] = [];
  list.forEach(v => {
    const total = parseFloat(v.totalSpend.replace(/,/g, "")) || 0;
    const n = Math.max(v.totalOrders, 0);
    if (!n || !total) return;
    const materials = v.type.split(" / ").map(s => s.trim()).filter(Boolean);
    const seed = v.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const weights: number[] = [];
    for (let i = 0; i < n; i++) weights.push(0.6 + (Math.sin((i + 1) * 12.9898 + seed) * 0.5 + 0.5) * 0.8);
    const sum = weights.reduce((a, w) => a + w, 0);
    for (let i = 0; i < n; i++) {
      const monthsBack = Math.floor((i / n) * LEDGER_MONTHS);
      const d = new Date(LEDGER_END.getFullYear(), LEDGER_END.getMonth() - monthsBack, 1 + ((i * 7 + seed) % 27));
      rows.push({
        vendorId: v.id,
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        amount: Math.round((weights[i] / sum) * total),
        material: materials[i % materials.length] || "Warp",
      });
    }
  });
  return rows;
}

export const MATERIAL_FILL: Record<string, string> = { Warp: T.royalBurgundy, Resham: T.antiqueGold, Jari: T.green };

// On-time delivery % per vendor id (from GRN receipts). Drives the reliability scatter.
export const DELIVERY_PERF: Record<string, { onTime: number; qualityRejects: number }> = {
  "VEN-001": { onTime: 96, qualityRejects: 1.2 },
  "VEN-002": { onTime: 91, qualityRejects: 2.4 },
  "VEN-003": { onTime: 74, qualityRejects: 4.8 },
  "VEN-004": { onTime: 94, qualityRejects: 1.8 },
  "VEN-005": { onTime: 88, qualityRejects: 3.1 },
  "VEN-006": { onTime: 68, qualityRejects: 6.2 },
};
const spendByType = [
  { name: "Warp", value: 2840000, fill: T.royalBurgundy },
  { name: "Resham", value: 1960000, fill: T.antiqueGold },
  { name: "Jari", value: 1200000, fill: T.green },
];

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

/** Days in a payment term string — "Net 30" → 30, "Advance" → 0. */
function termDays(terms: string): number {
  const m = terms.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}
function fmtDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")} ${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}`;
}

export function buildVendorOrders(vendor: Vendor) {
  const t1 = vendor.type.split(" / ")[0] || "Warp";
  const t2 = vendor.type.split(" / ")[1] || "Resham";
  return [
    { id: "PO-2026-041", invoiceNo: `INV-${vendor.initials}-2026-041`, date: "15 Jun 2026", status: "Delivered", grnId: "GRN-2026-MAY-814", firmName: "Beere Kesava Silks (Head Firm)", receivedDate: "20 May 2026", receiveStatus: "Match",
      materials: [
        { type: t1, description: "Premium quality raw threads", qty: "60 kg", invoiceAmount: "₹1,20,000" },
        { type: t2, description: "Standard dye grade lot", qty: "60 kg", invoiceAmount: "₹1,20,000" },
      ], totalAmount: "₹2,40,000", amount: 240000 },
    { id: "PO-2026-028", invoiceNo: `INV-${vendor.initials}-2026-028`, date: "02 May 2026", status: "Delivered", grnId: "GRN-2026-MAY-011", firmName: "Beere Kesava Silks (Head Firm)", receivedDate: "17 May 2026", receiveStatus: "Short",
      materials: [
        { type: t1, description: "Red 30 kg", qty: "30 kg", invoiceAmount: "₹1,25,000" },
        { type: t2, description: "Gold 24 kg", qty: "24 kg", invoiceAmount: "₹1,00,000" },
      ], totalAmount: "₹2,25,000", amount: 225000 },
    { id: "PO-2026-014", invoiceNo: `INV-${vendor.initials}-2026-014`, date: "10 Mar 2026", status: "Pending",
      materials: [{ type: t1, description: "Polyester 2G Gold 6 Buns", qty: "6 Buns", invoiceAmount: "₹65,000" }],
      totalAmount: "₹65,000", amount: 65000 },
    { id: "PO-2026-005", invoiceNo: `INV-${vendor.initials}-2026-005`, date: "18 Jan 2026", status: "Approved",
      materials: [{ type: t1, description: "Bulk replenishment stock", qty: "100 kg", invoiceAmount: "₹2,00,000" }],
      totalAmount: "₹2,00,000", amount: 200000 },
  ];
}

export function buildVendorLedger(vendor: Vendor) {
  const orders = buildVendorOrders(vendor);
  const outstanding = parseFloat(vendor.outstanding.replace(/,/g, "")) || 0;
  const totalBilled = orders.reduce((a, o) => a + o.amount, 0);
  let budget = Math.max(0, totalBilled - outstanding); // rupees actually settled
  const days = termDays(vendor.terms);
  const today = new Date();

  // Oldest bill first — that's the order money goes out in.
  const chronological = [...orders].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const bills: VendorBill[] = [];
  const txns: VendorPaymentTxn[] = [];
  let seq = 1;

  chronological.forEach((o, i) => {
    const billDate = new Date(o.date);
    const due = new Date(billDate);
    due.setDate(due.getDate() + days);
    const paid = Math.min(o.amount, budget);
    budget -= paid;
    const balance = o.amount - paid;
    const overdueDays = balance > 0 ? Math.max(0, Math.ceil((today.getTime() - due.getTime()) / 86400000)) : 0;

    bills.push({
      id: o.id, invoiceNo: o.invoiceNo, date: o.date, dueDate: fmtDate(due),
      amount: o.amount, paid, balance,
      status: balance === 0 ? "Paid" : paid > 0 ? (overdueDays > 0 ? "Overdue" : "Partial") : (overdueDays > 0 ? "Overdue" : "Pending"),
      daysOverdue: overdueDays,
    });

    if (paid > 0) {
      // Full settlements clear on the due date; part payments go out earlier.
      const payDate = new Date(billDate);
      payDate.setDate(payDate.getDate() + (balance === 0 ? Math.max(3, days - 2) : Math.round(days / 2)));
      const mode = PAY_MODES[(i + vendor.id.length) % PAY_MODES.length];
      txns.push({
        id: `VP-${vendor.id.slice(-3)}-${String(seq++).padStart(2, "0")}`,
        billId: o.id,
        date: fmtDate(payDate > today ? today : payDate),
        amount: paid,
        mode,
        reference: mode === "Cash" ? `CASH-${o.id.slice(-4)}` : mode === "Cheque" ? `CHQ-${o.id.slice(-6)}` : `UTR${payDate.getFullYear()}${String(payDate.getMonth() + 1).padStart(2, "0")}${String(payDate.getDate()).padStart(2, "0")}${String(seq).padStart(3, "0")}`,
        firm: "Beere Kesava Silks (Head Firm)",
        notes: balance === 0 ? "Full settlement" : "Part payment",
      });
    }
  });

  bills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return { orders, bills, txns, totalBilled, totalPaid: totalBilled - outstanding, outstanding };
}
