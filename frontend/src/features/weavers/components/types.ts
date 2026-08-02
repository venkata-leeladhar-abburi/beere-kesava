// ── Shared types ───────────────────────────────────────────────────────────
import { T } from "./theme";

export type Status = "active" | "qc" | "idle";

export const STATUS_CFG: Record<Status, { strip: string; label: string; badge: string; color: string }> = {
  active: { strip: T.green, label: "🟢 Currently Weaving", badge: "rgba(30,102,64,0.10)", color: T.green },
  qc: { strip: T.antiqueGold, label: "🟡 Sarees Submitted — Quality Check Pending", badge: "rgba(200,155,71,0.12)", color: "#8B6018" },
  idle: { strip: T.taupe, label: "⚪ No Active Batch", badge: "rgba(139,112,96,0.10)", color: T.taupe },
};

export interface AnalyticsWeaver {
  id: string; name: string; village: string; cluster: string; looms: number;
  status: Status; thisMonth: number; passRate: number; totalEver: number;
  totalPaid: number; photo: string | null; initials: string; bg: string;
}

export interface ProductionRow { weaverId: string; date: string; produced: number; passed: number; payout: number; }

export interface ParsedWeaverRow {
  name: string; village: string; mobile: string; looms: number; status: Status;
}
