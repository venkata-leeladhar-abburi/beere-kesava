import { Invoice } from "../types";

export const INVOICES: Invoice[] = [
  {
    id: "INV-2026-041", customer: "Lakshmi Silks", city: "Varanasi",
    invoiceDate: "08 Apr 2026", dueDate: "28 Apr 2026", total: 900000, paid: 900000, status: "Paid",
    payments: [
      { amount: 500000, date: "10 May 2026", utr: "UTR20260510LS1", method: "Bank Transfer", firmName: "Surat Zari Works" },
      { amount: 400000, date: "15 May 2026", utr: "UTR20260515LS2", method: "Bank Transfer", firmName: "Surat Zari Works" }
    ]
  },
  {
    id: "INV-2026-038", customer: "Padmavathi Textiles", city: "Surat",
    invoiceDate: "05 Apr 2026", dueDate: "25 Apr 2026", total: 600000, paid: 465000, status: "Overdue", daysOverdue: 5,
    payments: [
      { amount: 300000, date: "15 Apr 2026", utr: "UTR20260415PM1", method: "Bank Transfer", firmName: "Kanchipuram Silks" },
      { amount: 165000, date: "22 Apr 2026", utr: "UTR20260422PM2", method: "Bank Transfer", firmName: "Kanchipuram Silks" }
    ]
  },
  {
    id: "INV-2026-035", customer: "Vijaya Silk House", city: "Mumbai",
    invoiceDate: "10 Apr 2026", dueDate: "30 Apr 2026", total: 280000, paid: 280000, status: "Paid",
    payments: [
      { amount: 280000, date: "15 May 2026", utr: "UTR20260515VSH", method: "Bank Transfer", firmName: "Sri Venkateswara Textiles" }
    ]
  },
  {
    id: "INV-2026-032", customer: "Narayana Silk Emporium", city: "Hyderabad",
    invoiceDate: "01 Apr 2026", dueDate: "20 Apr 2026", total: 300000, paid: 254400, status: "Overdue", daysOverdue: 3,
    payments: [
      { amount: 150000, date: "12 Apr 2026", utr: "UTR20260412NS1", method: "Bank Transfer", firmName: "Lakshmi Silk Traders" },
      { amount: 104400, date: "18 Apr 2026", utr: "UTR20260418NS2", method: "Bank Transfer", firmName: "Lakshmi Silk Traders" }
    ]
  },
  {
    id: "INV-2026-029", customer: "Meenakshi Silks", city: "Chennai",
    invoiceDate: "15 Apr 2026", dueDate: "05 May 2026", total: 840000, paid: 420000, status: "Partial",
    payments: [
      { amount: 420000, date: "25 May 2026", utr: "UTR20260525MS", method: "Bank Transfer", firmName: "AK Traders" }
    ]
  },
  {
    id: "INV-2026-027", customer: "Kalavathi Exports", city: "Bengaluru",
    invoiceDate: "18 Apr 2026", dueDate: "02 May 2026", total: 660000, paid: 614400, status: "Overdue", daysOverdue: 2,
    payments: [
      { amount: 350000, date: "20 Apr 2026", utr: "UTR20260420KE1", method: "Bank Transfer", firmName: "Surat Zari Works" },
      { amount: 264400, date: "22 Apr 2026", utr: "UTR20260422KE2", method: "Bank Transfer", firmName: "Surat Zari Works" }
    ]
  },
];
