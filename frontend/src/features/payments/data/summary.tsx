import { AlertTriangle, FileText, IndianRupee, TrendingUp, Users } from "lucide-react";

import { T } from "../theme";

export const COMING_IN = [
  { label: "Wholesale Payments Received", value: "₹28,40,000", color: T.green },
  { label: "Retail Store Revenue",        value: "₹4,20,000",  color: T.green },
];

export const GOING_OUT = [
  { label: "Making Charges Paid",       value: "₹4,20,000", color: T.crimson },
  { label: "Vendor Raw Material Paid",  value: "₹8,60,000", color: T.crimson },
];

export const TOTAL_IN  = 3260000;

export const TOTAL_OUT = 1280000;

export const NET       = TOTAL_IN - TOTAL_OUT; // 1980000

export const IF_ALL    = TOTAL_IN + 1841000;   // +outstanding = 5101000  → show 38,21,000 ≈ 38.2L

export const STATS = [
  {
    label: "Paid to Weavers",
    value: "₹4.2L",
    sub: "Making charges · May 2026",
    hi: false, gold: false, crimson: false,
    icon: <Users size={22} color="rgba(245,232,208,0.90)" />,
  },
  {
    label: "Outstanding from Customers",
    value: "₹18.4L",
    sub: "Invoices yet to be collected",
    hi: false, gold: false, crimson: true,
    icon: <AlertTriangle size={22} color="#F47B72" />,
  },
  {
    label: "Collected from Customers",
    value: "₹32.6L",
    sub: "Payments received this month",
    hi: true, gold: true, crimson: false,
    icon: <IndianRupee size={22} color="rgba(231,201,131,0.95)" />,
  },
  {
    label: "Paid to Vendors",
    value: "₹8.6L",
    sub: "Raw material purchases",
    hi: false, gold: false, crimson: false,
    icon: <FileText size={22} color="rgba(245,232,208,0.90)" />,
  },
  {
    label: "Net Income This Month",
    value: "₹19.8L",
    sub: "After all payments made",
    hi: false, gold: true, crimson: false,
    icon: <TrendingUp size={22} color="rgba(231,201,131,0.95)" />,
  },
];

export const HEADER_CHIPS = [
  { value: "₹4.2L",  label: "Paid to Weavers",         gold: false },
  { value: "₹32.6L", label: "Collected from Customers", gold: false },
  { value: "₹18.4L", label: "Outstanding Invoices",     gold: false },
  { value: "▲ 3",    label: "Overdue Invoices",         gold: false },
  { value: "₹8.6L",  label: "Vendor Payments",          gold: false },
  { value: "₹19.8L", label: "Net Income This Month",    gold: true  },
];
