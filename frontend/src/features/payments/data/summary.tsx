import { AlertTriangle, FileText, IndianRupee, TrendingUp, Users } from "lucide-react";

import { T } from "../theme";

export const COMING_IN: any[] = [];
export const GOING_OUT: any[] = [];
export const TOTAL_IN  = 0;
export const TOTAL_OUT = 0;
export const NET       = 0;
export const IF_ALL    = 0;

export const STATS = [
  {
    label: "Paid to Weavers",
    value: "₹0",
    sub: "Making charges",
    hi: false, gold: false, crimson: false,
    icon: <Users size={22} color="rgba(245,232,208,0.90)" />,
  },
  {
    label: "Outstanding from Customers",
    value: "₹0",
    sub: "Invoices yet to be collected",
    hi: false, gold: false, crimson: true,
    icon: <AlertTriangle size={22} color="#F47B72" />,
  },
  {
    label: "Collected from Customers",
    value: "₹0",
    sub: "Payments received",
    hi: true, gold: true, crimson: false,
    icon: <IndianRupee size={22} color="rgba(231,201,131,0.95)" />,
  },
  {
    label: "Paid to Vendors",
    value: "₹0",
    sub: "Raw material purchases",
    hi: false, gold: false, crimson: false,
    icon: <FileText size={22} color="rgba(245,232,208,0.90)" />,
  },
  {
    label: "Net Income This Month",
    value: "₹0",
    sub: "After all payments made",
    hi: false, gold: true, crimson: false,
    icon: <TrendingUp size={22} color="rgba(231,201,131,0.95)" />,
  },
];

export const HEADER_CHIPS = [
  { value: "₹0", label: "Paid to Weavers",         gold: false },
  { value: "₹0", label: "Collected from Customers", gold: false },
  { value: "₹0", label: "Outstanding Invoices",     gold: false },
  { value: "0",  label: "Overdue Invoices",         gold: false },
  { value: "₹0", label: "Vendor Payments",          gold: false },
  { value: "₹0", label: "Net Income This Month",    gold: true  },
];
