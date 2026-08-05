import React from "react";
import { Package, Scissors, BarChart2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { T, F } from "../theme";
import { FadeUp, ChartCard, TabTitle, ReportDLBar, ChartTip, MiniDonut, TH, TD } from "../common/primitives";

const rawReceivedData = [
  { material: "Warp",   may: 50, apr: 40 },
  { material: "Resham", may: 75, apr: 58 },
  { material: "Jari",   may: 47, apr: 36 },
];
const rawGivenData = [
  { material: "Warp",   may: 22, apr: 18 },
  { material: "Resham", may: 51, apr: 40 },
  { material: "Jari",   may: 31, apr: 25 },
];
const REELS_PER_BUN = 4;
const bunsAndReels = (reels: number) => {
  const buns = Math.floor(reels / REELS_PER_BUN);
  const rem = reels % REELS_PER_BUN;
  return rem > 0 ? `${buns} Buns ${rem} Reel${rem > 1 ? "s" : ""}` : `${buns} Buns`;
};
const rawMaterialRows = [
  { type: "WARP",   sub: "Cotton / Silk",         open: 92,  recv: 50,  given: 22, close: 120, change: "↑ 30%",  oos: false, unit: "kg" },
  { type: "RESHAM", sub: "Red",                   open: 18,  recv: 30,  given: 8,  close: 40,  change: "↑ 122%", oos: false, unit: "kg" },
  { type: "RESHAM", sub: "Gold",                  open: 12,  recv: 25,  given: 10, close: 27,  change: "↑ 125%", oos: false, unit: "kg" },
  { type: "RESHAM", sub: "Green",                 open: 8,   recv: 20,  given: 18, close: 10,  change: "↑ 25%",  oos: false, unit: "kg" },
  { type: "RESHAM", sub: "Blue",                  open: 5,   recv: 0,   given: 5,  close: 0,   change: "— Out of Stock", oos: true, unit: "kg" },
  { type: "RESHAM", sub: "Maroon",                open: 6,   recv: 0,   given: 6,  close: 0,   change: "— Out of Stock", oos: true, unit: "kg" },
  { type: "RESHAM", sub: "Cream",                 open: 4,   recv: 0,   given: 4,  close: 0,   change: "— Out of Stock", oos: true, unit: "kg" },
  { type: "JARI",   sub: "Polyester 2G Gold",     open: 8,   recv: 15,  given: 6,  close: 17,  change: "↑ 112%", oos: false, unit: "reels" },
  { type: "JARI",   sub: "Polyester 1G Silver",   open: 3,   recv: 12,  given: 11, close: 4,   change: "↑ 33%",  oos: false, unit: "reels" },
  { type: "JARI",   sub: "Silk Fast 3G Gold",     open: 10,  recv: 20,  given: 14, close: 16,  change: "↑ 60%",  oos: false, unit: "reels" },
];

// Receipt-log rows — one row per GRN batch received against a PO (matches WorkerGRN + MaterialsPage "Recently Received")
interface RawMaterialReceiptRow {
  batchId: string;
  dateReceived: string;
  vendor: string;
  firmName: string;
  materialType: "Warp" | "Resham" | "Jari";
  description: string;
  quantity: string;
  unit: string;
  poReference: string;
  notes: string;
}
const rawReceiptRows: RawMaterialReceiptRow[] = [
  { batchId: "GRN-2026-MAY-014", dateReceived: "20 May 2026", vendor: "Surat Zari Works",          firmName: "Beere Kesava Silks (Head Firm)", materialType: "Jari",   description: "Polyester 2G Gold",  quantity: "6 Buns (24 Reels)", unit: "Buns", poReference: "PO-2026-020", notes: "" },
  { batchId: "GRN-2026-MAY-011", dateReceived: "17 May 2026", vendor: "Kanchipuram Silks",         firmName: "Beere Kesava Silks (Head Firm)", materialType: "Resham", description: "Red",                quantity: "30",                unit: "kg",   poReference: "PO-2026-021", notes: "Delivered in 2 lots" },
  { batchId: "GRN-2026-MAY-011", dateReceived: "17 May 2026", vendor: "Kanchipuram Silks",         firmName: "Beere Kesava Silks (Head Firm)", materialType: "Resham", description: "Gold",               quantity: "25",                unit: "kg",   poReference: "PO-2026-021", notes: "" },
  { batchId: "GRN-2026-MAY-006", dateReceived: "12 May 2026", vendor: "Sri Venkateswara Textiles", firmName: "Beere Kesava Silks (Head Firm)", materialType: "Warp",   description: "Cotton/Silk",        quantity: "50",                unit: "kg",   poReference: "PO-2026-022", notes: "" },
  { batchId: "GRN-2026-APR-028", dateReceived: "28 Apr 2026", vendor: "Ratan Zari Works",          firmName: "Beere Kesava Silks (Head Firm)", materialType: "Jari",   description: "Silk Fast 3G Gold",  quantity: "5 Buns (20 Reels)", unit: "Buns", poReference: "PO-2026-031", notes: "Short by 1 bun vs PO" },
];

export function RawMaterialReport() {
  return (
    <div id="rep-raw-materials" style={{ padding: "32px 40px" }}>
      <TabTitle title="Raw Material Report"
        sub="Track everything about raw material — how much was received from vendors, how much was given to weavers, and how much is still in the factory. Warp, Resham, and Jari tracked separately." />
      <ReportDLBar />

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, marginBottom: 28, alignItems: "stretch" }}>
        <ChartCard title="Raw Material Received from Vendors" sub="May 2026 vs April 2026" icon={<Package size={22} color={T.royalBurgundy} />}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rawReceivedData} barGap={4}>
              <CartesianGrid key="rm-recv-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="rm-recv-x" dataKey="material" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="rm-recv-y" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} unit=" kg" width={44} />
              <Tooltip key="rm-recv-tip" content={<ChartTip suffix=" kg" />} cursor={{ fill: "rgba(110,15,45,0.04)" }} />
              <Bar key="rm-recv-may" dataKey="may" name="May 2026" fill={T.royalBurgundy} radius={[4,4,0,0] as any} />
              <Bar key="rm-recv-apr" dataKey="apr" name="April 2026" fill={T.antiqueGold} radius={[4,4,0,0] as any} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 4 }}>
            {[{ c: T.royalBurgundy, l: "May 2026" }, { c: T.antiqueGold, l: "April 2026" }].map(x => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 9, height: 9, borderRadius: 2, background: x.c }} />
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{x.l}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Material Given to Weavers" sub="May 2026 vs April 2026" icon={<Scissors size={22} color={T.green} />}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rawGivenData} barGap={4}>
              <CartesianGrid key="rm-gvn-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="rm-gvn-x" dataKey="material" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="rm-gvn-y" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} unit=" kg" width={44} />
              <Tooltip key="rm-gvn-tip" content={<ChartTip suffix=" kg" />} cursor={{ fill: "rgba(110,15,45,0.04)" }} />
              <Bar key="rm-gvn-may" dataKey="may" name="May 2026" fill={T.green} radius={[4,4,0,0] as any} />
              <Bar key="rm-gvn-apr" dataKey="apr" name="April 2026" fill={T.green} radius={[4,4,0,0] as any} opacity={0.4} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 4 }}>
            {[{ c: T.green, l: "May 2026" }, { c: "rgba(30,102,64,0.4)", l: "April 2026" }].map(x => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 9, height: 9, borderRadius: 2, background: x.c }} />
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{x.l}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="What Is In Stock Right Now" sub="Current closing stock levels" icon={<BarChart2 size={22} color={T.antiqueGold} />}>
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-start", padding: "12px 0 8px" }}>
            <MiniDonut value={120} max={200} color={T.royalBurgundy} label="Warp" badge="Healthy" badgeType="ok" />
            <MiniDonut value={77}  max={150} color={T.antiqueGold}    label="Resham" badge="3 Out of Stock" badgeType="low" />
            <MiniDonut value={37}  max={80}  color={T.green}          label="Jari" unit="reels" footNote="9 Buns · 1 Reel" badge="Healthy" badgeType="ok" />
          </div>
        </ChartCard>
      </div>

      {/* Comparison table */}
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
              <thead>
                <tr>
                  <th style={TH}>Material Type</th>
                  <th style={TH}>Sub-type / Color / Grade</th>
                  <th style={{ ...TH, textAlign: "right" }}>Opening Stock</th>
                  <th style={{ ...TH, textAlign: "right" }}>Received This Period</th>
                  <th style={{ ...TH, textAlign: "right" }}>Given to Weavers</th>
                  <th style={{ ...TH, textAlign: "right" }}>Closing Stock</th>
                  <th style={{ ...TH, textAlign: "center" }}>Change vs Last Period</th>
                </tr>
              </thead>
              <tbody>
                {rawMaterialRows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${r.type === "WARP" ? T.royalBurgundy : r.type === "RESHAM" ? T.antiqueGold : T.green}` }}>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 7px", borderRadius: 5 }}>{r.type}</span></td>
                    <td style={TD}>{r.sub}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 600 }}>{r.open} {r.unit}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, color: T.green, fontWeight: 600 }}>{r.recv > 0 ? `${r.recv} ${r.unit}` : "—"}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, color: T.crimson }}>{r.given > 0 ? `${r.given} ${r.unit}` : "—"}</td>
                    <td style={{ ...TD, textAlign: "right" }}>
                      <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: r.close === 0 ? T.crimson : T.luxuryBrown }}>{r.close} {r.unit}</div>
                      {r.unit === "reels" && <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{bunsAndReels(r.close)}</div>}
                    </td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: r.oos ? T.crimson : T.green }}>{r.change}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: T.warmCream, borderTop: `2px solid ${T.borderDef}` }}>
                  <td colSpan={2} style={{ ...TD, fontFamily: F.ui, fontWeight: 700, color: T.luxuryBrown, background: T.warmCream }}>Total across all materials</td>
                  <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, background: T.warmCream }}>166 kg</td>
                  <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: T.green, background: T.warmCream }}>172 kg</td>
                  <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: T.crimson, background: T.warmCream }}>104 kg</td>
                  <td style={{ ...TD, textAlign: "right", fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.royalBurgundy, background: T.warmCream }}>234 kg</td>
                  <td style={{ ...TD, background: T.warmCream }} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </FadeUp>

      {/* Materials Received — Batch Log (per-GRN receipt log, matches WorkerGRN / MaterialsPage) */}
      <FadeUp>
        <div style={{ marginTop: 28 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, marginBottom: 4 }}>Materials Received — Batch Log</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 14 }}>Every material batch received from a vendor against a purchase order, with its GRN batch ID.</div>
          <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
                <thead>
                  <tr>
                    <th style={TH}>Batch ID</th>
                    <th style={TH}>Date Received</th>
                    <th style={TH}>Vendor</th>
                    <th style={TH}>Firm Name</th>
                    <th style={TH}>Material Type</th>
                    <th style={TH}>Description</th>
                    <th style={{ ...TH, textAlign: "right" }}>Quantity</th>
                    <th style={TH}>Unit</th>
                    <th style={TH}>PO Reference</th>
                    <th style={TH}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rawReceiptRows.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${r.materialType === "Warp" ? T.royalBurgundy : r.materialType === "Resham" ? T.antiqueGold : T.green}` }}>
                      <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{r.batchId}</span></td>
                      <td style={{ ...TD, fontFamily: F.mono, fontSize: 12 }}>{r.dateReceived}</td>
                      <td style={TD}>{r.vendor}</td>
                      <td style={TD}>{r.firmName}</td>
                      <td style={TD}>
                        <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 8px", borderRadius: 5 }}>{r.materialType}</span>
                      </td>
                      <td style={TD}>{r.description}</td>
                      <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 600 }}>{r.quantity}</td>
                      <td style={{ ...TD, fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{r.unit}</td>
                      <td style={{ ...TD, fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{r.poReference}</td>
                      <td style={{ ...TD, fontSize: 12, color: T.taupe }}>{r.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
