import { T } from "./theme";

// ── Data ───────────────────────────────────────────────────────────────────────
export const top10Customers = [
  { name: "Lakshmi Silks", spend: 1240000 },
  { name: "Narayana Silk", spend: 980000 },
  { name: "Padmavathi Tex", spend: 860000 },
  { name: "Vijaya Silk House", spend: 720000 },
  { name: "Meenakshi Silks", spend: 640000 },
  { name: "Kalavathi Exports", spend: 580000 },
  { name: "Sri Venkateshwara", spend: 420000 },
  { name: "Annapurna Textiles", spend: 360000 },
  { name: "Smt. Annapurna (R)", spend: 184000 },
  { name: "Smt. Lakshmi (R)", spend: 162000 },
];

export const revenueSplit = [
  { name: "Wholesale", value: 2840000, fill: T.royalBurgundy },
  { name: "Retail", value: 420000, fill: T.antiqueGold },
];

export const newVsReturning = [
  { month: "Dec", new: 12, returning: 45 },
  { month: "Jan", new: 15, returning: 48 },
  { month: "Feb", new: 10, returning: 52 },
  { month: "Mar", new: 18, returning: 55 },
  { month: "Apr", new: 14, returning: 60 },
  { month: "May", new: 22, returning: 65 },
];

export const frequentBuyers = [
  { name: "Lakshmi Silks", count: 22, freq: "Avg 2 per month" },
  { name: "Smt. Annapurna", count: 18, freq: "Avg 1.5 per month" },
  { name: "Narayana Silk", count: 16, freq: "Avg 1.3 per month" },
  { name: "Padmavathi Tex", count: 14, freq: "Avg 1.2 per month" },
  { name: "Smt. Lakshmi Bai", count: 12, freq: "Avg 1 per month" },
];

export const inactiveAlerts = [
  { name: "Srinivasa Silks", type: "Wholesale", time: "8 months ago" },
  { name: "Kalavathi Exports", type: "Wholesale", time: "7 months ago" },
  { name: "Smt. Rajeshwari", type: "Retail", time: "6 months ago" },
  { name: "Bhavani Silk House", type: "Wholesale", time: "9 months ago" },
  { name: "Sri Ram Textiles", type: "Wholesale", time: "11 months ago" },
];

export const wholesaleData = [
  { id: "WHL-001", name: "Lakshmi Silks", code: "LS", city: "Hyderabad, TG", status: "clear", orders: 22, spend: "12,40,000", out: "0", terms: "30 days", lastOrder: "28 Apr 2026", activeOrder: "ORD-2026-041", duesMsg: "✓ All Payments Clear", gstNumber: "36AAAAA1111A1Z1", visitingCard: "https://images.unsplash.com/photo-1589758438368-0ad531db3366?w=400&fit=crop&q=80" },
  { id: "WHL-002", name: "Narayana Silk Emporium", code: "NS", city: "Vijayawada, AP", status: "overdue", orders: 16, spend: "9,80,000", out: "3,50,000", terms: "30 days", lastOrder: "12 Apr 2026", activeOrder: "ORD-2026-032", duesMsg: "🔴 Overdue — ₹3,50,000 unpaid since 12 May 2026", paymentAlertDays: 47, gstNumber: "37BBBBB2222B2Z2", visitingCard: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&fit=crop&q=80" },
  { id: "WHL-003", name: "Padmavathi Textiles", code: "PT", city: "Guntur, AP", status: "overdue", orders: 14, spend: "8,60,000", out: "2,20,000", terms: "30 days", lastOrder: "20 Apr 2026", activeOrder: null, duesMsg: "🔴 Overdue — ₹2,20,000 unpaid since 20 May 2026", gstNumber: "37CCCCC3333C3Z3", visitingCard: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&fit=crop&q=80" },
  { id: "WHL-004", name: "Vijaya Silk House", code: "VS", city: "Chennai, TN", status: "clear", orders: 18, spend: "7,20,000", out: "0", terms: "45 days", lastOrder: "15 Apr 2026", activeOrder: null, duesMsg: "✓ All Payments Clear", gstNumber: "33DDDDD4444D4Z4", visitingCard: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&fit=crop&q=80" },
  { id: "WHL-005", name: "Meenakshi Silks", code: "MS", city: "Coimbatore, TN", status: "due", orders: 12, spend: "6,40,000", out: "1,80,000", terms: "60 days", lastOrder: "05 Apr 2026", activeOrder: null, duesMsg: "◐ ₹1,80,000 due by 04 Jun 2026", gstNumber: "33EEEEE5555E5Z5", visitingCard: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=400&fit=crop&q=80" },
  { id: "WHL-006", name: "Kalavathi Exports", code: "KE", city: "Bengaluru, KA", status: "overdue", orders: 10, spend: "5,80,000", out: "1,80,000", terms: "45 days", lastOrder: "02 Apr 2026", activeOrder: null, duesMsg: "🔴 Overdue — ₹1,80,000 unpaid since 17 May 2026", gstNumber: "29FFFFF6666F6Z6", visitingCard: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&fit=crop&q=80" },
  { id: "WHL-007", name: "Srinivasa Silks", code: "SS", city: "Kurnool, AP", status: "inactive", orders: 8, spend: "4,20,000", out: "0", terms: "30 days", lastOrder: "8 months ago", activeOrder: null, duesMsg: "✓ All Payments Clear — Inactive", gstNumber: "37GGGGG7777G7Z7", visitingCard: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&fit=crop&q=80" },
  { id: "WHL-008", name: "Annapurna Textiles", code: "AT", city: "Nellore, AP", status: "due", orders: 9, spend: "3,60,000", out: "2,20,000", terms: "90 days", lastOrder: "20 Mar 2026", activeOrder: null, duesMsg: "○ ₹2,20,000 due by 18 Jun 2026 — within terms", gstNumber: "37HHHHH8888H8Z8", visitingCard: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&fit=crop&q=80" },
];

export const retailData = [
  { name: "Smt. Annapurna Devi", initials: "AD", phone: "+91 ×××× 7823", city: "Hyderabad, TG", purchases: 18, spend: "1,84,000", lastVisit: "15 May 2026", regular: true, inactive: false },
  { name: "Smt. Lakshmi Bai", initials: "LB", phone: "+91 ×××× 3412", city: "Vijayawada, AP", purchases: 12, spend: "1,62,000", lastVisit: "10 May 2026", regular: true, inactive: false },
  { name: "Smt. Padmavathi", initials: "SP", phone: "+91 ×××× 9981", city: "Guntur, AP", purchases: 4, spend: "48,000", lastVisit: "02 May 2026", regular: false, inactive: false },
  { name: "Sri Ramesh K.", initials: "RK", phone: "+91 ×××× 4421", city: "Nellore, AP", purchases: 1, spend: "12,500", lastVisit: "20 May 2026", regular: false, inactive: false },
  { name: "Smt. Saraswathi", initials: "SS", phone: "+91 ×××× 6634", city: "Hyderabad, TG", purchases: 7, spend: "84,000", lastVisit: "05 May 2026", regular: true, inactive: false },
  { name: "Smt. Rajeshwari", initials: "SR", phone: "+91 ×××× 2218", city: "Chennai, TN", purchases: 2, spend: "28,000", lastVisit: "6 months ago", regular: false, inactive: true },
];

export const inactiveData = [
  { name: "Srinivasa Silks", type: "Wholesale", city: "Kurnool, AP", last: "8 months ago", spend: "4,20,000" },
  { name: "Kalavathi Exports", type: "Wholesale", city: "Bengaluru, KA", last: "7 months ago", spend: "5,80,000" },
  { name: "Bhavani Silk House", type: "Wholesale", city: "Vijayawada, AP", last: "9 months ago", spend: "3,40,000" },
  { name: "Sri Ram Textiles", type: "Wholesale", city: "Nellore, AP", last: "11 months ago", spend: "2,80,000" },
  { name: "Smt. Rajeshwari", type: "Retail", city: "Chennai, TN", last: "6 months ago", spend: "28,000" },
  { name: "Smt. Kamakshi", type: "Retail", city: "Tirupati, AP", last: "7 months ago", spend: "16,500" },
  { name: "Dharani Silks", type: "Wholesale", city: "Guntur, AP", last: "8 months ago", spend: "1,90,000" },
  { name: "Smt. Meenakshi", type: "Retail", city: "Hyderabad, TG", last: "6 months ago", spend: "42,000" },
  { name: "Pavithra Textiles", type: "Wholesale", city: "Coimbatore, TN", last: "10 months ago", spend: "2,20,000" },
  { name: "Smt. Bharati", type: "Retail", city: "Vijayawada, AP", last: "9 months ago", spend: "8,500" },
];

export const top10RetailCustomers = [
  { name: "Smt. Annapurna Devi", spend: 184000 },
  { name: "Smt. Lakshmi Bai", spend: 162000 },
  { name: "Smt. Saraswathi", spend: 84000 },
  { name: "Smt. Padmavathi", spend: 48000 },
  { name: "Smt. Meenakshi", spend: 42000 },
  { name: "Smt. Rajeshwari", spend: 28000 },
  { name: "Smt. Kamakshi", spend: 16500 },
  { name: "Sri Ramesh K.", spend: 12500 },
  { name: "Smt. Bharati", spend: 8500 },
  { name: "Smt. Radhika", spend: 4200 },
];

export const retailCategorySplit = [
  { name: "Heavy Zari", value: 184000, fill: T.royalBurgundy },
  { name: "Plain Silk", value: 82000, fill: T.antiqueGold },
  { name: "Bridal Special", value: 154000, fill: T.greenMid },
];

export const frequentRetailBuyers = [
  { name: "Smt. Annapurna", count: 18, freq: "Avg 1.5 per month" },
  { name: "Smt. Lakshmi", count: 12, freq: "Avg 1 per month" },
  { name: "Smt. Saraswathi", count: 7, freq: "Avg 0.6 per month" },
];

export const inactiveRetailAlerts = [
  { name: "Smt. Rajeshwari", type: "Retail", time: "6 months ago" },
  { name: "Smt. Kamakshi", type: "Retail", time: "7 months ago" },
  { name: "Smt. Meenakshi", type: "Retail", time: "6 months ago" },
];

export const newVsReturningRetail = [
  { month: "Dec", new: 4, returning: 12 },
  { month: "Jan", new: 6, returning: 15 },
  { month: "Feb", new: 3, returning: 10 },
  { month: "Mar", new: 8, returning: 18 },
  { month: "Apr", new: 5, returning: 14 },
  { month: "May", new: 10, returning: 22 },
];
