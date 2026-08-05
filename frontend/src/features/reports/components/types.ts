import type { IconComponent } from "../../../lib/icon";

export type ReportTabKey =
  | "raw-material"
  | "production"
  | "outstanding"
  | "outstanding-payments"
  | "weaver-payment"
  | "retail"
  | "wholesale"
  | "pnl"
  | "customers"
  | "overdue";

export interface ReportTab {
  key: ReportTabKey;
  Icon: IconComponent;
  label: string;
  desc: string;
  iconColor: string;
  iconBg: string;
}
