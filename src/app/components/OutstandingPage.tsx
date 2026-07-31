import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, ChevronDown, ChevronUp, ChevronRight, Package, TrendingUp, Download,
  Users, Factory, Truck, Layers, RotateCcw, AlertTriangle,
} from "lucide-react";
import {
  useSales, UnifiedSaree, SareeOrigin, SellerRank,
  isOutstanding, isSold, ageBucket, rankSellers, purchaseOutstanding,
} from "./SalesContext";
import { useDownloadsAllowed } from "./DownloadAccess";

// ── Design tokens (same palette as the rest of the app) ──────────────────────
const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   "#C89B47",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#8B7060",
  crimson:       "#C0392B",
  green:         "#1E6640",
  orange:        "#E67E22",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
const G = { card: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)" };

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const AGE_BUCKETS = ["0-30", "31-60", "61-90", "90+"] as const;
type AgeKey = typeof AGE_BUCKETS[number] | "all";

const AGE_COLOR: Record<string, string> = {
  "0-30": T.green, "31-60": T.antiqueGold, "61-90": T.orange, "90+": T.crimson,
};

// ── Small building blocks ────────────────────────────────────────────────────
function StatChip({ label, value, tone = "plain" }: { label: string; value: string; tone?: "plain" | "gold" | "green" | "red" }) {
  const c = tone === "gold" ? T.antiqueGold : tone === "green" ? "#6DCE9A" : tone === "red" ? "#F0857D" : "#FFFDF9";
  const bg = tone === "gold" ? "rgba(200,155,71,0.18)" : tone === "green" ? "rgba(30,102,64,0.20)" : tone === "red" ? "rgba(224,82,82,0.18)" : "rgba(255,253,249,0.10)";
  const bd = tone === "gold" ? "rgba(200,155,71,0.38)" : tone === "green" ? "rgba(30,102,64,0.35)" : tone === "red" ? "rgba(224,82,82,0.35)" : "rgba(255,253,249,0.15)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: bg, border: `1px solid ${bd}`, borderRadius: 99, padding: "9px 18px" }}>
      <span style={{ fontFamily: F.display, fontSize: 21, fontWeight: 700, color: c }}>{value}</span>
      <span style={{ fontFamily: F.ui, fontSize: 12.5, color: tone === "plain" ? "rgba(255,253,249,0.68)" : c }}>{label}</span>
    </div>
  );
}

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 11, color, background: bg, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

/** Shows only how many days the saree has been sitting in our inventory. */
function AgePill({ days }: { days: number }) {
  const c = AGE_COLOR[ageBucket(days)];
  return <Pill label={`${days} ${days === 1 ? "day" : "days"}`} color={c} bg={`${c}1A`} />;
}

function Card({ children, pad = 22 }: { children: React.ReactNode; pad?: number }) {
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(74,6,27,0.06)", padding: pad }}>
      {children}
    </div>
  );
}

function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
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

const th: React.CSSProperties = {
  fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase",
  letterSpacing: "0.8px", textAlign: "left", padding: "10px 12px", borderBottom: `1.5px solid ${T.borderDef}`, whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "11px 12px", borderBottom: `1px solid rgba(110,15,45,0.06)`, verticalAlign: "middle",
};
const tdMono: React.CSSProperties = { ...td, fontFamily: F.mono, fontSize: 12.5, fontWeight: 600, color: T.royalBurgundy };

function ScrollTable({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>{children}</table>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <Package size={40} color={T.taupe} style={{ opacity: 0.45, marginBottom: 12 }} />
      <div style={{ fontFamily: F.display, fontSize: 16, color: T.taupe }}>{msg}</div>
    </div>
  );
}

// ── CSV export ───────────────────────────────────────────────────────────────
function exportCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function ExportBtn({ onClick }: { onClick: () => void }) {
  // Single choke point for every CSV export on this page.
  if (!useDownloadsAllowed()) return null;
  return (
    <motion.button onClick={onClick} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(110,15,45,0.06)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 10, padding: "9px 16px", fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
      <Download size={14} /> Export CSV
    </motion.button>
  );
}

// ── Who made / supplied a saree, for tables that mix origins ─────────────────
function sareeOriginName(s: UnifiedSaree): string {
  if (s.origin === "weaver")      return s.weaverName || "—";
  if (s.origin === "factoryLoom") return s.factoryLoomNumber || "—";
  return s.supplier || "—";
}
function sareeOriginSub(s: UnifiedSaree): string {
  if (s.origin === "weaver")      return `Weaver · ${s.weaverId} · Loom ${s.weaverLoom}`;
  if (s.origin === "factoryLoom") return `Factory Loom · ${s.operatorName}`;
  return `External · ${s.invoiceNumber}`;
}

/** Sale-status chip used in the "Produced" view. */
function StatusChip({ s }: { s: UnifiedSaree }) {
  const cfg =
    s.status === "retail"    ? { l: "Sold · Retail",    c: "#4A7FB5" } :
    s.status === "wholesale" ? { l: "Sold · Wholesale", c: "#9B4DCA" } :
    s.status === "returned"  ? { l: "Returned",         c: T.crimson } :
                               { l: "In Stock",         c: T.green   };
  return <Pill label={cfg.l} color={cfg.c} bg={`${cfg.c}1A`} />;
}

export type TableMode = "outstanding" | "sold" | "produced";

// ── Saree detail rows (shared by weaver / loom / batch / purchase drilldowns) ──
export function SareeDetailTable({ sarees, mode = "outstanding", showReturn = false, showBatch = false, showSource = false }: {
  sarees: UnifiedSaree[]; mode?: TableMode; showReturn?: boolean; showBatch?: boolean; showSource?: boolean;
}) {
  if (sarees.length === 0) {
    return <Empty msg={mode === "sold" ? "No sarees sold here yet." : mode === "produced" ? "No sarees here." : "No sarees outstanding here."} />;
  }
  return (
    <ScrollTable>
      <thead>
        <tr>
          <th style={th}>Saree Code</th>
          {showBatch  && <th style={th}>Batch</th>}
          {showSource && <th style={th}>Made By</th>}
          <th style={th}>Saree Type</th>
          <th style={th}>Weight</th>
          <th style={th}>{showReturn ? "Received" : "QC Date"}</th>
          {mode === "outstanding" && <th style={th}>Days In Stock</th>}
          {mode === "produced"    && <th style={th}>Status</th>}
          {mode === "sold" && <>
            <th style={th}>Sold On</th>
            <th style={th}>Channel</th>
            <th style={th}>Customer</th>
            <th style={th}>Sale Ref</th>
          </>}
          <th style={{ ...th, textAlign: "right" }}>Cost</th>
          <th style={{ ...th, textAlign: "right" }}>{mode === "sold" ? "Sold For" : "Sell Price"}</th>
          {showReturn && <th style={th}>Return</th>}
        </tr>
      </thead>
      <tbody>
        {sarees.map(s => (
          <tr key={s.sareeId}>
            <td style={tdMono}>{s.sareeId}</td>
            {showBatch && <td style={tdMono}>{s.batchId || "—"}</td>}
            {showSource && (
              <td style={td}>
                <div style={{ fontWeight: 600 }}>{sareeOriginName(s)}</div>
                <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{sareeOriginSub(s)}</div>
              </td>
            )}
            <td style={td}>{s.sareeTypeCode !== "EX-000" ? `${s.sareeTypeCode} · ` : ""}{s.sareeTypeName}</td>
            <td style={{ ...td, fontFamily: F.mono, fontSize: 12.5 }}>{s.weight}</td>
            <td style={td}>{s.qcDate}</td>
            {mode === "outstanding" && <td style={td}><AgePill days={s.ageDays} /></td>}
            {mode === "produced"    && <td style={td}><StatusChip s={s} /></td>}
            {mode === "sold" && <>
              <td style={td}>{s.sale?.date || "—"}</td>
              <td style={td}>{s.sale ? <Pill label={s.sale.channel === "retail" ? "Retail" : "Wholesale"} color={s.sale.channel === "retail" ? "#4A7FB5" : "#9B4DCA"} bg={s.sale.channel === "retail" ? "rgba(74,127,181,0.12)" : "rgba(155,77,202,0.12)"} /> : "—"}</td>
              <td style={td}>{s.sale?.customer || "—"}</td>
              <td style={tdMono}>{s.sale?.saleRef || "—"}</td>
            </>}
            <td style={{ ...td, textAlign: "right", fontFamily: F.mono, fontSize: 12.5 }}>{inr(s.costPrice)}</td>
            <td style={{ ...td, textAlign: "right", fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: mode === "sold" ? T.green : T.royalBurgundy }}>
              {mode === "sold" ? inr(s.sale?.amount || 0) : inr(s.finalAmount)}
            </td>
            {showReturn && (
              <td style={td}>
                {s.ret
                  ? <div>
                      <Pill label={s.ret.restocked ? "Returned · Restocked" : "Returned · Not restocked"} color={T.crimson} bg="rgba(192,57,43,0.10)" />
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 4 }}>{s.ret.returnRef} · {s.ret.date}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{s.ret.reason}</div>
                    </div>
                  : <span style={{ color: T.taupe, fontSize: 12 }}>—</span>}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </ScrollTable>
  );
}

// ── Produced / Sold / Outstanding sub-tabs inside an expanded group row ───────
function DrilldownTabs({ produced, sold, outstanding, showBatch = false, showSource = false, producedLabel = "Produced" }: {
  produced: UnifiedSaree[]; sold: UnifiedSaree[]; outstanding: UnifiedSaree[];
  showBatch?: boolean; showSource?: boolean; producedLabel?: string;
}) {
  const [view, setView] = useState<TableMode>("outstanding");
  const tabs: { key: TableMode; label: string; rows: UnifiedSaree[]; color: string }[] = [
    { key: "produced",    label: producedLabel,  rows: produced,    color: T.luxuryBrown },
    { key: "sold",        label: "Sold",         rows: sold,        color: T.green },
    { key: "outstanding", label: "Outstanding",  rows: outstanding, color: T.crimson },
  ];
  const active = tabs.find(t => t.key === view) || tabs[2];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {tabs.map(t => {
          const on = view === t.key;
          return (
            <button key={t.key} onClick={() => setView(t.key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
                padding: "8px 16px", borderRadius: 99, fontFamily: F.ui, fontSize: 13, fontWeight: 700,
                background: on ? t.color : "#FFFFFF",
                color: on ? "#FFFDF9" : T.taupe,
                border: on ? "none" : `1.5px solid ${T.borderDef}`,
                transition: "all 0.16s",
              }}>
              {t.label}
              <span style={{
                fontFamily: F.mono, fontSize: 12, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
                background: on ? "rgba(255,255,255,0.22)" : "rgba(110,15,45,0.07)",
                color: on ? "#FFFDF9" : t.color,
              }}>{t.rows.length}</span>
            </button>
          );
        })}
      </div>
      <SareeDetailTable sarees={active.rows} mode={active.key} showBatch={showBatch} showSource={showSource} />
    </div>
  );
}

// ── In-house outstanding (weavers or factory looms) ──────────────────────────
function InHouseOutstanding({
  origin, sarees, search, ageFilter,
}: {
  origin: Extract<SareeOrigin, "weaver" | "factoryLoom">;
  sarees: UnifiedSaree[]; search: string; ageFilter: AgeKey;
}) {
  const [open, setOpen] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, { key: string; name: string; sub: string; all: UnifiedSaree[]; soldRows: UnifiedSaree[]; rows: UnifiedSaree[] }>();
    const q = search.trim().toLowerCase();
    sarees.filter(s => s.origin === origin).forEach(s => {
      const key = origin === "weaver" ? (s.weaverId || "?") : (s.factoryLoomId || "?");
      const name = origin === "weaver" ? (s.weaverName || "—") : (s.factoryLoomNumber || "—");
      const sub  = origin === "weaver" ? `${s.weaverId} · Loom ${s.weaverLoom}` : `${s.operatorName} · ${s.loomLocation}`;
      // Search narrows every list; the ageing filter applies only to outstanding stock.
      if (q && !s.sareeId.toLowerCase().includes(q) && !name.toLowerCase().includes(q)
            && !s.sareeTypeName.toLowerCase().includes(q) && !(s.batchId || "").toLowerCase().includes(q)) return;
      let g = map.get(key);
      if (!g) { g = { key, name, sub, all: [], soldRows: [], rows: [] }; map.set(key, g); }
      g.all.push(s);
      if (isSold(s)) g.soldRows.push(s);
      if (!isOutstanding(s)) return;
      if (ageFilter !== "all" && ageBucket(s.ageDays) !== ageFilter) return;
      g.rows.push(s);
    });
    return [...map.values()].filter(g => g.all.length > 0).sort((a, b) => b.rows.length - a.rows.length);
  }, [sarees, origin, search, ageFilter]);

  const totalOut = groups.reduce((a, g) => a + g.rows.length, 0);
  const totalVal = groups.reduce((a, g) => a + g.rows.reduce((x, s) => x + s.finalAmount, 0), 0);
  const totalProduced = groups.reduce((a, g) => a + g.all.length, 0);
  const totalSold = groups.reduce((a, g) => a + g.soldRows.length, 0);

  const label = origin === "weaver" ? "Weaver" : "Factory Loom";

  return (
    <Card>
      <SectionTitle
        title={`Outstanding Sarees — ${origin === "weaver" ? "Weavers" : "Factory Looms"}`}
        sub={`Sarees produced ${origin === "weaver" ? "by our weavers" : "on our factory looms"} that are still not sold — neither retail nor wholesale. Returned sarees that went back into stock are counted here too.`}
        right={
          <ExportBtn onClick={() => exportCsv(
            `outstanding-${origin}.csv`,
            [[label, "Ref", "Saree Code", "Batch", "Saree Type", "Weight", "QC Date", "Days In Stock", "Cost", "Sell Price"],
             ...groups.flatMap(g => g.rows.map(s => [g.name, g.sub, s.sareeId, s.batchId || "—", s.sareeTypeName, s.weight, s.qcDate, s.ageDays, s.costPrice, s.finalAmount]))],
          )} />
        }
      />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        {[
          { l: "Produced", v: String(totalProduced), c: T.luxuryBrown },
          { l: "Sold", v: String(totalSold), c: T.green },
          { l: "Outstanding", v: String(totalOut), c: T.crimson },
          { l: `${label}s with Stock`, v: String(groups.length), c: T.royalBurgundy },
          { l: "Expected Sale Value", v: inr(totalVal), c: T.green },
        ].map(k => (
          <div key={k.l} style={{ flex: "1 1 190px", background: T.warmCream, borderRadius: 12, padding: "13px 16px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 5 }}>{k.l}</div>
            <div style={{ fontFamily: F.display, fontSize: 21, fontWeight: 700, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      {groups.length === 0 ? <Empty msg="Nothing outstanding for the current filters." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {groups.map(g => {
            const isOpen = open === g.key;
            const val = g.rows.reduce((a, s) => a + s.finalAmount, 0);
            return (
              <div key={g.key} style={{ border: `1px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden" }}>
                <button
                  onClick={() => setOpen(isOpen ? null : g.key)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: isOpen ? "rgba(110,15,45,0.04)" : "#FFF", border: "none", cursor: "pointer", textAlign: "left" }}
                >
                  {isOpen ? <ChevronDown size={17} color={T.royalBurgundy} /> : <ChevronRight size={17} color={T.taupe} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>{g.name}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{g.sub}</div>
                  </div>
                  <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.7px" }}>Produced</div>
                      <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{g.all.length}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.7px" }}>Sold</div>
                      <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.green }}>{g.soldRows.length}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.7px" }}>Outstanding</div>
                      <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.crimson }}>{g.rows.length}</div>
                    </div>
                    <div style={{ textAlign: "right", minWidth: 96 }}>
                      <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.7px" }}>Value</div>
                      <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>{inr(val)}</div>
                    </div>
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", background: "#FFFDF9" }}>
                      <div style={{ padding: "10px 18px 16px" }}>
                        <DrilldownTabs produced={g.all} sold={g.soldRows} outstanding={g.rows} showBatch />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ── Outstanding by batch (in-house batches across weavers + factory looms) ───
function BatchOutstanding({ sarees, search, ageFilter }: { sarees: UnifiedSaree[]; search: string; ageFilter: AgeKey }) {
  const [open, setOpen] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, {
      key: string; all: UnifiedSaree[]; soldRows: UnifiedSaree[]; rows: UnifiedSaree[];
      weavers: Set<string>; looms: Set<string>;
    }>();
    const q = search.trim().toLowerCase();
    sarees.filter(s => s.batchId).forEach(s => {
      const key = s.batchId as string;
      if (q && !key.toLowerCase().includes(q) && !s.sareeId.toLowerCase().includes(q)
            && !sareeOriginName(s).toLowerCase().includes(q) && !s.sareeTypeName.toLowerCase().includes(q)) return;
      let g = map.get(key);
      if (!g) { g = { key, all: [], soldRows: [], rows: [], weavers: new Set(), looms: new Set() }; map.set(key, g); }
      g.all.push(s);
      if (isSold(s)) g.soldRows.push(s);
      if (s.origin === "weaver" && s.weaverName) g.weavers.add(s.weaverName);
      if (s.origin === "factoryLoom" && s.factoryLoomNumber) g.looms.add(s.factoryLoomNumber);
      if (!isOutstanding(s)) return;
      if (ageFilter !== "all" && ageBucket(s.ageDays) !== ageFilter) return;
      g.rows.push(s);
    });
    return [...map.values()].filter(g => g.all.length > 0).sort((a, b) => b.rows.length - a.rows.length);
  }, [sarees, search, ageFilter]);

  const totalProduced = groups.reduce((a, g) => a + g.all.length, 0);
  const totalSold = groups.reduce((a, g) => a + g.soldRows.length, 0);
  const totalOut = groups.reduce((a, g) => a + g.rows.length, 0);
  const totalVal = groups.reduce((a, g) => a + g.rows.reduce((x, s) => x + s.finalAmount, 0), 0);

  return (
    <Card>
      <SectionTitle
        title="Outstanding Sarees — By Batch"
        sub="Every production batch and how much of it is still unsold. Covers in-house batches only — weavers and factory looms. External purchases are billed per invoice, not per batch."
        right={
          <ExportBtn onClick={() => exportCsv("outstanding-by-batch.csv",
            [["Batch", "Saree Code", "Made By", "Reference", "Saree Type", "Weight", "QC Date", "Days In Stock", "Cost", "Sell Price"],
             ...groups.flatMap(g => g.rows.map(s => [g.key, s.sareeId, sareeOriginName(s), sareeOriginSub(s), s.sareeTypeName, s.weight, s.qcDate, s.ageDays, s.costPrice, s.finalAmount]))])} />
        }
      />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        {[
          { l: "Produced", v: String(totalProduced), c: T.luxuryBrown },
          { l: "Sold", v: String(totalSold), c: T.green },
          { l: "Outstanding", v: String(totalOut), c: T.crimson },
          { l: "Batches with Stock", v: String(groups.length), c: T.royalBurgundy },
          { l: "Expected Sale Value", v: inr(totalVal), c: T.green },
        ].map(k => (
          <div key={k.l} style={{ flex: "1 1 170px", background: T.warmCream, borderRadius: 12, padding: "13px 16px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 5 }}>{k.l}</div>
            <div style={{ fontFamily: F.display, fontSize: 21, fontWeight: 700, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      {groups.length === 0 ? <Empty msg="Nothing outstanding for the current filters." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {groups.map(g => {
            const isOpen = open === g.key;
            const val = g.rows.reduce((a, s) => a + s.finalAmount, 0);
            const parts = [
              g.weavers.size ? `${g.weavers.size} weaver${g.weavers.size > 1 ? "s" : ""}` : "",
              g.looms.size ? `${g.looms.size} factory loom${g.looms.size > 1 ? "s" : ""}` : "",
            ].filter(Boolean).join(" · ");
            return (
              <div key={g.key} style={{ border: `1px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden" }}>
                <button onClick={() => setOpen(isOpen ? null : g.key)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: isOpen ? "rgba(110,15,45,0.04)" : "#FFF", border: "none", cursor: "pointer", textAlign: "left" }}>
                  {isOpen ? <ChevronDown size={17} color={T.royalBurgundy} /> : <ChevronRight size={17} color={T.taupe} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: T.royalBurgundy }}>{g.key}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{parts || "—"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {[
                      { l: "Produced", v: String(g.all.length), c: T.luxuryBrown },
                      { l: "Sold", v: String(g.soldRows.length), c: T.green },
                      { l: "Outstanding", v: String(g.rows.length), c: T.crimson },
                      { l: "Value", v: inr(val), c: T.royalBurgundy },
                    ].map(k => (
                      <div key={k.l} style={{ textAlign: "right", minWidth: 62 }}>
                        <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.7px" }}>{k.l}</div>
                        <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: k.c }}>{k.v}</div>
                      </div>
                    ))}
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", background: "#FFFDF9" }}>
                      <div style={{ padding: "10px 18px 16px" }}>
                        <DrilldownTabs produced={g.all} sold={g.soldRows} outstanding={g.rows} showSource />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ── External purchases outstanding — purchase-wise, per supplier ─────────────
function ExternalOutstanding({ sarees, search, ageFilter }: { sarees: UnifiedSaree[]; search: string; ageFilter: AgeKey }) {
  const [open, setOpen] = useState<string | null>(null);
  const all = useMemo(() => purchaseOutstanding(sarees), [sarees]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all
      .map(p => ({
        ...p,
        unsoldSarees: p.unsoldSarees.filter(s => ageFilter === "all" || ageBucket(s.ageDays) === ageFilter),
      }))
      .filter(p => !q || p.supplier.toLowerCase().includes(q) || p.invoiceNumber.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
      .sort((a, b) => b.unsoldSarees.length - a.unsoldSarees.length);
  }, [all, search, ageFilter]);

  const bySupplier = useMemo(() => {
    const m = new Map<string, { supplier: string; purchases: number; bought: number; unsold: number; returned: number; due: number; unsoldValue: number }>();
    all.forEach(p => {
      let r = m.get(p.supplier);
      if (!r) { r = { supplier: p.supplier, purchases: 0, bought: 0, unsold: 0, returned: 0, due: 0, unsoldValue: 0 }; m.set(p.supplier, r); }
      r.purchases++; r.bought += p.sareeCount; r.unsold += p.unsoldCount;
      r.returned += p.returnedCount; r.due += p.dueAmount; r.unsoldValue += p.unsoldValue;
    });
    return [...m.values()].sort((a, b) => b.unsold - a.unsold);
  }, [all]);

  const totBought = all.reduce((a, p) => a + p.sareeCount, 0);
  const totSold = all.reduce((a, p) => a + p.soldCount, 0);
  const totUnsold = all.reduce((a, p) => a + p.unsoldCount, 0);
  const totReturned = all.reduce((a, p) => a + p.returnedCount, 0);
  const totDue = all.reduce((a, p) => a + p.dueAmount, 0);
  const totUnsoldVal = all.reduce((a, p) => a + p.unsoldValue, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <SectionTitle
          title="External Purchases — Outstanding by Purchase"
          sub="Every purchase from every supplier, showing the sarees still unsold from that bill, the bill amount still due, and any sarees returned by customers after a retail sale."
          right={
            <ExportBtn onClick={() => exportCsv("outstanding-external-purchases.csv",
              [["Purchase ID", "Supplier", "Location", "Invoice No", "GST No", "Purchase Date", "Bill Amount", "Paid", "Bill Due", "Bill Status", "Sarees Bought", "Sold", "Unsold", "Returned", "Unsold Cost", "Unsold Sale Value", "Refund Value"],
               ...all.map(p => [p.id, p.supplier, p.location, p.invoiceNumber, p.gstNumber, p.date, p.billAmount, p.paidAmount, p.dueAmount, p.status, p.sareeCount, p.soldCount, p.unsoldCount, p.returnedCount, p.unsoldCost, p.unsoldValue, p.refundValue])])} />
          }
        />

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          {[
            { l: "Purchased", v: String(totBought), c: T.luxuryBrown },
            { l: "Sold", v: String(totSold), c: T.green },
            { l: "Outstanding", v: String(totUnsold), c: T.crimson },
            { l: "Customer Returns", v: String(totReturned), c: T.orange },
            { l: "Bill Amount Due", v: inr(totDue), c: T.royalBurgundy },
            { l: "Unsold Stock Value", v: inr(totUnsoldVal), c: T.green },
          ].map(k => (
            <div key={k.l} style={{ flex: "1 1 160px", background: T.warmCream, borderRadius: 12, padding: "13px 16px" }}>
              <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 5 }}>{k.l}</div>
              <div style={{ fontFamily: F.display, fontSize: 21, fontWeight: 700, color: k.c }}>{k.v}</div>
            </div>
          ))}
        </div>

        {rows.length === 0 ? <Empty msg="No purchases match the current filters." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map(p => {
              const isOpen = open === p.id;
              const statusCfg = p.status === "Paid"
                ? { color: T.green, bg: "rgba(30,102,64,0.09)" }
                : p.status === "Partial"
                ? { color: T.crimson, bg: "rgba(192,57,43,0.08)" }
                : { color: T.orange, bg: "rgba(230,126,34,0.12)" };
              return (
                <div key={p.id} style={{ border: `1px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden" }}>
                  <button onClick={() => setOpen(isOpen ? null : p.id)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: isOpen ? "rgba(110,15,45,0.04)" : "#FFF", border: "none", cursor: "pointer", textAlign: "left" }}>
                    {isOpen ? <ChevronDown size={17} color={T.royalBurgundy} /> : <ChevronRight size={17} color={T.taupe} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>{p.supplier}</span>
                        <Pill label={p.status} color={statusCfg.color} bg={statusCfg.bg} />
                        {p.returnedCount > 0 && <Pill label={`${p.returnedCount} returned`} color={T.crimson} bg="rgba(192,57,43,0.10)" />}
                      </div>
                      <div style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe, marginTop: 3 }}>
                        {p.id} · {p.invoiceNumber} · {p.date} · {p.location}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {[
                        { l: "Purchased", v: String(p.sareeCount), c: T.luxuryBrown },
                        { l: "Sold", v: String(p.soldCount), c: T.green },
                        { l: "Outstanding", v: String(p.unsoldCount), c: T.crimson },
                        { l: "Bill Due", v: inr(p.dueAmount), c: p.dueAmount > 0 ? T.orange : T.green },
                      ].map(k => (
                        <div key={k.l} style={{ textAlign: "right", minWidth: 60 }}>
                          <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.7px" }}>{k.l}</div>
                          <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: k.c }}>{k.v}</div>
                        </div>
                      ))}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", background: "#FFFDF9" }}>
                        <div style={{ padding: "10px 18px 18px", display: "flex", flexDirection: "column", gap: 18 }}>

                          {/* Bill detail */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                            {[
                              { l: "GST Number",     v: p.gstNumber },
                              { l: "Bill Amount",    v: inr(p.billAmount) },
                              { l: "Paid",           v: inr(p.paidAmount) },
                              { l: "Bill Due",       v: inr(p.dueAmount) },
                              { l: "Unsold Cost",    v: inr(p.unsoldCost) },
                              { l: "Unsold Sale Value", v: inr(p.unsoldValue) },
                            ].map(k => (
                              <div key={k.l} style={{ background: T.warmCream, borderRadius: 10, padding: "10px 13px" }}>
                                <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>{k.l}</div>
                                <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{k.v}</div>
                              </div>
                            ))}
                          </div>

                          <DrilldownTabs
                            produced={p.sarees}
                            sold={p.sarees.filter(isSold)}
                            outstanding={p.unsoldSarees}
                            producedLabel="Purchased"
                          />

                          {p.returnedSarees.length > 0 && (
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                                <RotateCcw size={14} color={T.crimson} />
                                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.crimson, textTransform: "uppercase", letterSpacing: "0.9px" }}>
                                  Customer returns ({p.returnedSarees.length}) · refund {inr(p.refundValue)}
                                </span>
                              </div>
                              <SareeDetailTable sarees={p.returnedSarees} showReturn />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Supplier roll-up */}
      <Card>
        <SectionTitle title="Supplier Roll-up" sub="Same numbers grouped by supplier across all their purchases." />
        <ScrollTable>
          <thead>
            <tr>
              <th style={th}>Supplier</th>
              <th style={{ ...th, textAlign: "right" }}>Purchases</th>
              <th style={{ ...th, textAlign: "right" }}>Purchased</th>
              <th style={{ ...th, textAlign: "right" }}>Outstanding</th>
              <th style={{ ...th, textAlign: "right" }}>Returned</th>
              <th style={{ ...th, textAlign: "right" }}>Unsold Value</th>
              <th style={{ ...th, textAlign: "right" }}>Bill Due</th>
            </tr>
          </thead>
          <tbody>
            {bySupplier.map(r => (
              <tr key={r.supplier}>
                <td style={{ ...td, fontWeight: 600 }}>{r.supplier}</td>
                <td style={{ ...tdMono, textAlign: "right" }}>{r.purchases}</td>
                <td style={{ ...tdMono, textAlign: "right" }}>{r.bought}</td>
                <td style={{ ...tdMono, textAlign: "right", color: T.crimson }}>{r.unsold}</td>
                <td style={{ ...tdMono, textAlign: "right", color: T.orange }}>{r.returned}</td>
                <td style={{ ...tdMono, textAlign: "right" }}>{inr(r.unsoldValue)}</td>
                <td style={{ ...tdMono, textAlign: "right", color: r.due > 0 ? T.orange : T.green }}>{inr(r.due)}</td>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </Card>
    </div>
  );
}

// ── Who is selling more ──────────────────────────────────────────────────────
const RANK_PAGE = 5;

function RankTable({ title, sub, ranks, unitLabel }: { title: string; sub: string; ranks: SellerRank[]; unitLabel: string }) {
  const max = Math.max(1, ...ranks.map(r => r.sold));
  const [shown, setShown] = useState(RANK_PAGE);
  const visible = ranks.slice(0, shown);
  const remaining = ranks.length - visible.length;
  return (
    <Card>
      <SectionTitle title={title} sub={sub}
        right={<ExportBtn onClick={() => exportCsv(`${title.toLowerCase().replace(/[^a-z]+/g, "-")}.csv`,
          [[unitLabel, "Reference", "Produced", "Sold", "Retail", "Wholesale", "Returned", "Outstanding", "Sell-through %", "Net Revenue"],
           ...ranks.map(r => [r.name, r.sub, r.produced, r.sold, r.retail, r.wholesale, r.returned, r.outstanding, r.sellThroughPct, r.revenue])])} />}
      />
      <ScrollTable>
        <thead>
          <tr>
            <th style={{ ...th, width: 44 }}>#</th>
            <th style={th}>{unitLabel}</th>
            <th style={th}>Sold</th>
            <th style={{ ...th, textAlign: "right" }}>Produced</th>
            <th style={{ ...th, textAlign: "right" }}>Retail</th>
            <th style={{ ...th, textAlign: "right" }}>Wholesale</th>
            <th style={{ ...th, textAlign: "right" }}>Returned</th>
            <th style={{ ...th, textAlign: "right" }}>Outstanding</th>
            <th style={{ ...th, textAlign: "right" }}>Sell-through</th>
            <th style={{ ...th, textAlign: "right" }}>Net Revenue</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r, i) => (
            <tr key={r.key}>
              <td style={{ ...td, fontFamily: F.display, fontWeight: 700, color: i < 3 ? T.antiqueGold : T.taupe }}>{i + 1}</td>
              <td style={td}>
                <div style={{ fontWeight: 700, color: T.luxuryBrown }}>{r.name}</div>
                <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{r.sub}</div>
              </td>
              <td style={{ ...td, minWidth: 150 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ flex: 1, height: 7, borderRadius: 99, background: "rgba(110,15,45,0.08)", overflow: "hidden", minWidth: 70 }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(r.sold / max) * 100}%` }} transition={{ duration: 0.6 }}
                      style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${T.royalBurgundy}, ${T.antiqueGold})` }} />
                  </div>
                  <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy, minWidth: 22 }}>{r.sold}</span>
                </div>
              </td>
              <td style={{ ...tdMono, textAlign: "right", color: T.luxuryBrown }}>{r.produced}</td>
              <td style={{ ...tdMono, textAlign: "right", color: "#4A7FB5" }}>{r.retail}</td>
              <td style={{ ...tdMono, textAlign: "right", color: "#9B4DCA" }}>{r.wholesale}</td>
              <td style={{ ...tdMono, textAlign: "right", color: r.returned ? T.crimson : T.taupe }}>{r.returned}</td>
              <td style={{ ...tdMono, textAlign: "right", color: T.orange }}>{r.outstanding}</td>
              <td style={{ ...tdMono, textAlign: "right", color: r.sellThroughPct >= 60 ? T.green : r.sellThroughPct >= 35 ? T.antiqueGold : T.crimson }}>{r.sellThroughPct}%</td>
              <td style={{ ...tdMono, textAlign: "right", fontWeight: 700 }}>{inr(r.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </ScrollTable>

      {/* Load more / show less */}
      {ranks.length > RANK_PAGE && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 16 }}>
          <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>
            Showing {visible.length} of {ranks.length}
          </span>
          {remaining > 0 ? (
            <motion.button onClick={() => setShown(s => s + RANK_PAGE)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(110,15,45,0.06)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.20)`, borderRadius: 10, padding: "10px 20px", fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <ChevronDown size={15} /> Load more ({Math.min(RANK_PAGE, remaining)} more)
            </motion.button>
          ) : (
            <motion.button onClick={() => setShown(RANK_PAGE)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "transparent", color: T.taupe, border: `1.5px solid rgba(110,15,45,0.16)`, borderRadius: 10, padding: "10px 20px", fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <ChevronUp size={15} /> Show less
            </motion.button>
          )}
        </div>
      )}
    </Card>
  );
}

function TopSellers({ sarees }: { sarees: UnifiedSaree[] }) {
  const weavers = useMemo(() => rankSellers(sarees, "weaver"), [sarees]);
  const looms   = useMemo(() => rankSellers(sarees, "factoryLoom"), [sarees]);
  const suppliers = useMemo(() => rankSellers(sarees, "external"), [sarees]);

  const best = [
    { l: "Top Weaver",         r: weavers[0],   icon: <Users size={16} color={T.antiqueGold} /> },
    { l: "Top Factory Loom",   r: looms[0],     icon: <Factory size={16} color={T.antiqueGold} /> },
    { l: "Top Supplier",       r: suppliers[0], icon: <Truck size={16} color={T.antiqueGold} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {best.map(b => (
          <Card key={b.l} pad={18}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              {b.icon}
              <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{b.l}</span>
            </div>
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown }}>{b.r?.name || "—"}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 10 }}>{b.r?.sub || ""}</div>
            <div style={{ display: "flex", gap: 18 }}>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px" }}>Sold</div>
                <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 700, color: T.royalBurgundy }}>{b.r?.sold ?? 0}</div>
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px" }}>Net Revenue</div>
                <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 700, color: T.green }}>{inr(b.r?.revenue ?? 0)}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <RankTable title="Weavers — Selling Performance"       sub="Which weaver's sarees are actually moving out of stock." ranks={weavers}   unitLabel="Weaver" />
      <RankTable title="Factory Looms — Selling Performance"  sub="Which in-house loom's output sells fastest."             ranks={looms}     unitLabel="Factory Loom" />
      <RankTable title="Suppliers — Selling Performance"      sub="Which external supplier's sarees sell best. Net revenue is after deducting customer refunds." ranks={suppliers} unitLabel="Supplier" />
    </div>
  );
}

// ── Filter bar ───────────────────────────────────────────────────────────────
function FilterBar({
  search, setSearch, ageFilter, setAgeFilter, count,
}: {
  search: string; setSearch: (v: string) => void;
  ageFilter: AgeKey; setAgeFilter: (v: AgeKey) => void;
  count: number;
}) {
  return (
    <Card pad={16}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <Search size={16} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search saree code, weaver, loom, supplier, invoice, saree type…"
            style={{ width: "100%", height: 42, paddingLeft: 42, paddingRight: 14, fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown, background: T.silkCream, border: `1.5px solid ${T.borderDef}`, borderRadius: 11, outline: "none", boxSizing: "border-box" }} />
        </div>

        {(
          <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700 }}>Ageing</span>
            {(["all", ...AGE_BUCKETS] as AgeKey[]).map(k => (
              <button key={k} onClick={() => setAgeFilter(k)}
                style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, padding: "8px 14px", borderRadius: 99, cursor: "pointer", background: ageFilter === k ? T.royalBurgundy : "transparent", color: ageFilter === k ? "#FFFDF9" : T.taupe, border: ageFilter === k ? "none" : `1.5px solid rgba(110,15,45,0.18)` }}>
                {k === "all" ? "All ages" : `${k} d`}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", background: T.warmCream, borderRadius: 10, padding: "8px 14px" }}>
          <Package size={15} color={T.taupe} />
          <span style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe, fontWeight: 600 }}>{count} outstanding</span>
        </div>
      </div>
    </Card>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
type OutTab = "weaver" | "factoryLoom" | "external" | "batch" | "ranking";

const OUT_TABS: { key: OutTab; label: string; desc: string; Icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { key: "weaver",      label: "In-House · Weavers",       desc: "Unsold from our weavers",  Icon: Users },
  { key: "factoryLoom", label: "In-House · Factory Looms", desc: "Unsold from our looms",    Icon: Factory },
  { key: "external",    label: "External Purchases",       desc: "Purchase-wise + returns",  Icon: Truck },
  { key: "batch",       label: "By Batches",               desc: "Unsold per batch",         Icon: Layers },
  { key: "ranking",     label: "Who Is Selling More",      desc: "Weaver / loom / supplier", Icon: TrendingUp },
];

export function OutstandingPage({ embedded = false }: { embedded?: boolean }) {
  const { sarees } = useSales();
  const [tab, setTab] = useState<OutTab>("weaver");
  const [search, setSearch] = useState("");
  const [ageFilter, setAgeFilter] = useState<AgeKey>("all");

  const totals = useMemo(() => {
    const out = sarees.filter(isOutstanding);
    return {
      all: out.length,
      weaver: out.filter(s => s.origin === "weaver").length,
      loom: out.filter(s => s.origin === "factoryLoom").length,
      external: out.filter(s => s.origin === "external").length,
      batched: out.filter(s => !!s.batchId).length,
      returned: sarees.filter(s => s.status === "returned").length,
      value: out.reduce((a, s) => a + s.finalAmount, 0),
      aged90: out.filter(s => s.ageDays > 90).length,
    };
  }, [sarees]);

  /** Unsold count shown on each tab card. Ranking tab shows no count. */
  const tabCounts: Record<OutTab, number | null> = {
    weaver: totals.weaver,
    factoryLoom: totals.loom,
    external: totals.external,
    batch: totals.batched,
    ranking: null,
  };
  const tabCount = tabCounts[tab] ?? totals.all;

  return (
    <div style={{ background: T.silkCream, fontFamily: F.ui, minHeight: embedded ? undefined : "100vh" }}>

      {/* HERO */}
      <section style={{ background: G.card, padding: "44px 40px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(135deg, rgba(200,155,71,0.04) 0px, rgba(200,155,71,0.04) 1px, transparent 1px, transparent 60px)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(200,155,71,0.80)", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 10 }}>
            REPORTS · OUTSTANDING STOCK
          </div>
          <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 38, color: "#FFFDF9", margin: 0, lineHeight: 1.12 }}>
            Outstanding Sarees Report
          </h1>
          <p style={{ fontFamily: F.ui, fontSize: 14.5, color: "rgba(255,253,249,0.65)", margin: "10px 0 0", lineHeight: 1.6, maxWidth: 720 }}>
            Every saree still not sold — retail or wholesale — split by where it came from: our own weavers,
            our factory looms, and external purchases. External purchases are shown purchase-wise with bill dues
            and customer returns.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: "26px 0 32px" }}>
            <StatChip label="Total Outstanding" value={String(totals.all)} />
            <StatChip label="From Weavers" value={String(totals.weaver)} tone="gold" />
            <StatChip label="From Factory Looms" value={String(totals.loom)} tone="gold" />
            <StatChip label="From External" value={String(totals.external)} tone="gold" />
            <StatChip label="Customer Returns" value={String(totals.returned)} tone="red" />
            <StatChip label="Stock Value" value={inr(totals.value)} tone="green" />
          </div>
        </div>
      </section>

      {/* TAB STRIP */}
      {/* Not sticky when embedded in ReportsPage — that page already has a sticky tab bar. */}
      <div style={{ position: embedded ? "relative" : "sticky", top: 0, zIndex: 30, background: "linear-gradient(180deg, #3D0E1A, #2C0913)", boxShadow: "0 6px 24px rgba(0,0,0,0.20)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, padding: "18px 40px 20px" }}>
          {OUT_TABS.map(t => {
            const active = tab === t.key;
            const count = tabCounts[t.key];
            return (
              <motion.button key={t.key} onClick={() => setTab(t.key)}
                whileHover={{ y: -3 }} whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                style={{
                  display: "flex", alignItems: "center", gap: 14, textAlign: "left", cursor: "pointer",
                  padding: "18px 20px", borderRadius: 16, minWidth: 0,
                  background: active ? "linear-gradient(135deg, rgba(200,155,71,0.26), rgba(200,155,71,0.12))" : "rgba(255,253,249,0.06)",
                  border: `2px solid ${active ? T.antiqueGold : "rgba(255,253,249,0.12)"}`,
                  boxShadow: active ? "0 8px 26px rgba(200,155,71,0.22)" : "none",
                }}>
                <div style={{ width: 48, height: 48, borderRadius: 13, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: active ? T.antiqueGold : "rgba(255,253,249,0.10)" }}>
                  <t.Icon size={24} color={active ? "#2C0913" : "rgba(255,253,249,0.70)"} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: "#FFFDF9", lineHeight: 1.25 }}>{t.label}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12.5, color: active ? "rgba(231,201,131,0.95)" : "rgba(255,253,249,0.45)", marginTop: 3 }}>{t.desc}</div>
                </div>
                {count !== null && (
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: active ? T.antiqueGold : "rgba(255,253,249,0.80)", lineHeight: 1 }}>{count}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 10, color: "rgba(255,253,249,0.40)", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: 4 }}>Unsold</div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* AGED ALERT */}
      {totals.aged90 > 0 && (
        <div style={{ padding: "22px 40px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, background: "rgba(192,57,43,0.07)", border: `1px solid rgba(192,57,43,0.22)`, borderRadius: 12, padding: "13px 18px" }}>
            <AlertTriangle size={17} color={T.crimson} />
            <span style={{ fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown }}>
              <strong style={{ color: T.crimson }}>{totals.aged90} sarees</strong> have been sitting unsold for more than 90 days. Use the <strong>90+ d</strong> ageing filter to see them.
            </span>
          </div>
        </div>
      )}

      {/* BODY */}
      <div style={{ padding: "22px 40px 48px", display: "flex", flexDirection: "column", gap: 20 }}>
        {tab !== "ranking" && (
          <FilterBar
            search={search} setSearch={setSearch}
            ageFilter={ageFilter} setAgeFilter={setAgeFilter}
            count={tabCount}
          />
        )}

        {tab === "weaver" && (
          <InHouseOutstanding origin="weaver" sarees={sarees} search={search} ageFilter={ageFilter} />
        )}
        {tab === "factoryLoom" && (
          <InHouseOutstanding origin="factoryLoom" sarees={sarees} search={search} ageFilter={ageFilter} />
        )}
        {tab === "external" && (
          <ExternalOutstanding sarees={sarees} search={search} ageFilter={ageFilter} />
        )}
        {tab === "batch" && (
          <BatchOutstanding sarees={sarees} search={search} ageFilter={ageFilter} />
        )}
        {tab === "ranking" && <TopSellers sarees={sarees} />}
      </div>
    </div>
  );
}
