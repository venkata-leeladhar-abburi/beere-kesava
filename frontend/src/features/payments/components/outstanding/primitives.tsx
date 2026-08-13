import React from "react";
import { Download, Package, type LucideIcon } from "lucide-react";
import { T, F } from "../../theme";
import { ageBucket } from "../../../customers/contexts/SalesContext";
import { useDownloadsAllowed } from "../../../../shared/ui/DownloadAccess";
import { Button } from "../../../../shared/ui/primitives";
import { rupees, formatMoney } from "@/lib/domain/money";

export const inr = (n: number) => formatMoney(rupees(n));

export const AGE_BUCKETS = ["0-30", "31-60", "61-90", "90+"] as const;
export type AgeKey = typeof AGE_BUCKETS[number] | "all";

export const AGE_COLOR: Record<string, string> = {
  "0-30": T.green, "31-60": T.antiqueGold, "61-90": T.orange, "90+": T.crimson,
};

// ── Small building blocks ────────────────────────────────────────────────────
export function StatChip({ label, value, tone = "plain" }: { label: string; value: string; tone?: "plain" | "gold" | "green" | "red" }) {
  const c = tone === "gold" ? T.antiqueGold : tone === "green" ? "#6DCE9A" : tone === "red" ? "#F0857D" : "#FFFDF9";
  const bg = tone === "gold" ? "rgba(200,155,71,0.18)" : tone === "green" ? "rgba(30,102,64,0.20)" : tone === "red" ? "rgba(224,82,82,0.18)" : "rgba(255,253,249,0.10)";
  const bd = tone === "gold" ? "rgba(200,155,71,0.38)" : tone === "green" ? "rgba(30,102,64,0.35)" : tone === "red" ? "rgba(224,82,82,0.35)" : "rgba(255,253,249,0.15)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: bg, border: `1px solid ${bd}`, borderRadius: 99, padding: "9px 18px" }}>
      <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: c }}>{value}</span>
      <span style={{ fontFamily: F.ui, fontSize: 12, color: tone === "plain" ? "rgba(255,253,249,0.68)" : c }}>{label}</span>
    </div>
  );
}

export function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color, background: bg, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

/** Shows only how many days the saree has been sitting in our inventory. */
export function AgePill({ days }: { days: number }) {
  const c = AGE_COLOR[ageBucket(days)];
  return <Pill label={`${days} ${days === 1 ? "day" : "days"}`} color={c} bg={`${c}1A`} />;
}

export function Card({ children, pad = 22 }: { children: React.ReactNode; pad?: number }) {
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(74,6,27,0.06)", padding: pad }}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
      <div>
        <h3 style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown, margin: 0 }}>{title}</h3>
        {sub && <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: "5px 0 0" }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

// Section banner card — dark maroon gradient header (icon + title + subtitle
// + actions) atop a white padded body, matching the pattern used across the
// rest of the app.
export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  actions,
  children,
  id,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>
      <div style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={26} color="#FFFDF9" />
          </div>
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px" }}>{title}</div>
            {subtitle && <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>{subtitle}</div>}
          </div>
        </div>
        {actions && <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>{actions}</div>}
      </div>
      <div style={{ padding: "24px 28px 28px" }}>
        {children}
      </div>
    </div>
  );
}

const td: React.CSSProperties = {
  fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "11px 12px", borderBottom: `1px solid rgba(110,15,45,0.06)`, verticalAlign: "middle",
};
export const tdMono: React.CSSProperties = { ...td, fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy };

export function Empty({ msg }: { msg: string }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <Package size={40} color={T.taupe} style={{ opacity: 0.45, marginBottom: 12 }} />
      <div style={{ fontFamily: F.display, fontSize: 16, color: T.taupe }}>{msg}</div>
    </div>
  );
}

// ── CSV export ───────────────────────────────────────────────────────────────
export function exportCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function ExportBtn({ onClick }: { onClick: () => void }) {
  // Single choke point for every CSV export on this page.
  if (!useDownloadsAllowed()) return null;
  return (
    <Button variant="tertiary" size="sm" iconLeft={Download} onClick={onClick}>
      Export CSV
    </Button>
  );
}
