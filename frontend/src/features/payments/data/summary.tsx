import { AlertTriangle, FileText, IndianRupee, TrendingUp, Users } from "lucide-react";

import { rupees, formatMoney } from "@/lib/domain/money";

const ZERO = formatMoney(rupees(0));

export const COMING_IN: unknown[] = [];
export const GOING_OUT: unknown[] = [];
export const TOTAL_IN  = 0;
export const TOTAL_OUT = 0;
export const NET       = 0;
export const IF_ALL    = 0;

export const STATS = [
  {
    label: "Paid to Weavers",
    value: ZERO,
    sub: "Making charges",
    hi: false, gold: false, crimson: false,
    icon: <Users size={22} color="rgba(245,232,208,0.90)" />,
  },
  {
    label: "Outstanding from Customers",
    value: ZERO,
    sub: "Invoices yet to be collected",
    hi: false, gold: false, crimson: true,
    icon: <AlertTriangle size={22} color="#F47B72" />,
  },
  {
    label: "Collected from Customers",
    value: ZERO,
    sub: "Payments received",
    hi: true, gold: true, crimson: false,
    icon: <IndianRupee size={22} color="rgba(231,201,131,0.95)" />,
  },
  {
    label: "Paid to Vendors",
    value: ZERO,
    sub: "Raw material purchases",
    hi: false, gold: false, crimson: false,
    icon: <FileText size={22} color="rgba(245,232,208,0.90)" />,
  },
  {
    label: "Net Income This Month",
    value: ZERO,
    sub: "After all payments made",
    hi: false, gold: true, crimson: false,
    icon: <TrendingUp size={22} color="rgba(231,201,131,0.95)" />,
  },
];

export const HEADER_CHIPS = [
  { value: ZERO, label: "Paid to Weavers",         gold: false },
  { value: ZERO, label: "Collected from Customers", gold: false },
  { value: ZERO, label: "Outstanding Invoices",     gold: false },
  { value: "0",  label: "Overdue Invoices",         gold: false },
  { value: ZERO, label: "Vendor Payments",          gold: false },
  { value: ZERO, label: "Net Income This Month",    gold: true  },
];
