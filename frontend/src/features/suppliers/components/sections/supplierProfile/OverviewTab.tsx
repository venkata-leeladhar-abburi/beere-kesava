// Overview tab of the supplier profile: time-range KPIs, spend/status
// charts, the external purchase inventory browser, and any open purchase
// requests raised for this supplier.

import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Search, Package, FileText, Wallet, IndianRupee } from "lucide-react";
import { DateFilterBar, DateFilterState } from "../../../../../shared/ui/DateFilterBar";
import { T, F } from "../../theme";
import { Purchase, SareeTag, PurchaseRequest, formatINR, purchaseTotals } from "../../../contexts/SupplierContext";
import { inp } from "../../common/primitives";
import { SareeInventoryTable } from "../SareeInventoryTable";

type SareeRow = SareeTag & { purchaseId: string; invoiceNumber: string };

export function OverviewTab({
  card, supplierName, invFilter, setInvFilter,
  rangePurchases, rangeBilled, rangePaid, filteredSarees,
  sareeSearch, setSareeSearch, typeFilter, setTypeFilter, sareeTypes,
  colorFilter, setColorFilter, sareeColors, purchaseFilter, setPurchaseFilter, purchaseOptions,
  spendByMonth, paymentStatusBreakdown, myRequests,
}: {
  card: React.CSSProperties;
  supplierName: string;
  invFilter: DateFilterState;
  setInvFilter: (f: DateFilterState) => void;
  rangePurchases: Purchase[];
  rangeBilled: number;
  rangePaid: number;
  filteredSarees: SareeRow[];
  sareeSearch: string;
  setSareeSearch: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  sareeTypes: string[];
  colorFilter: string;
  setColorFilter: (v: string) => void;
  sareeColors: string[];
  purchaseFilter: string;
  setPurchaseFilter: (v: string) => void;
  purchaseOptions: Purchase[];
  spendByMonth: { month: string; spend: number }[];
  paymentStatusBreakdown: { name: string; value: number; fill: string }[];
  myRequests: PurchaseRequest[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Time-range controls drive every number and the inventory below. */}
      <div style={{ ...card, padding: "18px 22px" }}>
        <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>Time Range</div>
        <DateFilterBar filter={invFilter} onChange={setInvFilter} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {[
          { label: "Purchases in Range", value: String(rangePurchases.length),        sub: `${filteredSarees.length} sarees`,                     color: T.luxuryBrown, Icon: Package },
          { label: "Billed in Range",    value: formatINR(rangeBilled),               sub: "Total invoiced by supplier",                          color: "#8B6018",     Icon: FileText },
          { label: "Paid in Range",      value: formatINR(rangePaid),                 sub: "Amount settled to supplier",                          color: T.green,       Icon: Wallet },
          { label: "Balance in Range",   value: formatINR(rangeBilled - rangePaid),   sub: rangeBilled - rangePaid > 0 ? "Still to be paid" : "Fully settled", color: rangeBilled - rangePaid > 0 ? T.crimson : T.green, Icon: IndianRupee },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <s.Icon size={15} color={T.royalBurgundy} />
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 600 }}>{s.label}</div>
            </div>
            <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
            <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 6 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Analytics */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <div style={{ ...card, padding: "24px 28px" }}>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown, marginBottom: 20 }}>Purchase Spend by Month</div>
          {spendByMonth.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No purchases recorded yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={spendByMonth} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <RechartsTooltip formatter={(v: any) => [formatINR(Number(v)), "Spend"]} contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 10, border: `1px solid ${T.borderDef}` }} />
                <Bar dataKey="spend" fill={T.royalBurgundy} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ ...card, padding: "24px 28px" }}>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown, marginBottom: 4 }}>Purchases by Payment Status</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 16 }}>Billed amount split by what's paid, partial, or still pending.</div>
          {paymentStatusBreakdown.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No purchases recorded yet.</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={paymentStatusBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={32}>
                    {paymentStatusBreakdown.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <RechartsTooltip formatter={(v: any) => [formatINR(Number(v))]} contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 10, border: `1px solid ${T.borderDef}` }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {paymentStatusBreakdown.map(s => (
                  <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: s.fill }} />
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{s.name}</span>
                    </div>
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{formatINR(s.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* External purchase inventory */}
      <div style={card}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>External Purchase Inventory</div>
              <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, marginTop: 3 }}>Every saree bought from {supplierName} in the selected time range.</div>
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "6px 12px", borderRadius: 8 }}>
              {filteredSarees.length} saree{filteredSarees.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Buying / selling / profit across the sarees currently listed */}
          {filteredSarees.length > 0 && (() => {
            const t = purchaseTotals(filteredSarees);
            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Pieces", text: String(t.pieces), color: T.luxuryBrown, bg: T.silkCream, border: T.borderDef },
                  { label: "Buying Price", text: formatINR(t.buying), color: T.luxuryBrown, bg: T.silkCream, border: T.borderDef },
                  { label: "Selling Price", text: formatINR(t.selling), color: T.antiqueGold, bg: "rgba(200,155,71,0.10)", border: T.borderGold },
                  { label: "Profit", text: formatINR(t.profit), color: T.green, bg: T.greenBg, border: "rgba(30,102,64,0.20)" },
                ].map(({ label, text, color, bg, border }) => (
                  <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: 0.6, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color }}>{text}</div>
                  </div>
                ))}
              </div>
            );
          })()}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 240px" }}>
              <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.taupe, pointerEvents: "none" }} />
              <input value={sareeSearch} onChange={e => setSareeSearch(e.target.value)} placeholder="Search saree ID, type, colour…"
                style={{ ...inp, paddingLeft: 34, background: T.silkCream, fontSize: 13 }} />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...inp, width: "auto", minWidth: 150, cursor: "pointer", background: T.silkCream, fontSize: 13 }}>
              {sareeTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={colorFilter} onChange={e => setColorFilter(e.target.value)} style={{ ...inp, width: "auto", minWidth: 150, cursor: "pointer", background: T.silkCream, fontSize: 13 }}>
              {sareeColors.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={purchaseFilter} onChange={e => setPurchaseFilter(e.target.value)} style={{ ...inp, width: "auto", minWidth: 190, cursor: "pointer", background: T.silkCream, fontSize: 13 }}>
              <option value="All Purchases">All Purchase Orders</option>
              {purchaseOptions.map(p => (
                <option key={p.id} value={p.id}>{p.id} · {p.invoiceNumber || "no invoice"}</option>
              ))}
            </select>
          </div>
        </div>
        <SareeInventoryTable rows={filteredSarees} />
      </div>

      {/* Purchase requests raised for this supplier */}
      {myRequests.length > 0 && (
        <div style={card}>
          <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}`, fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>Purchase Requests</div>
          {myRequests.map((r, i) => (
            <div key={r.id} style={{ padding: "14px 22px", borderTop: i > 0 ? `1px solid ${T.borderDef}` : "none", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy, minWidth: 90 }}>{r.id}</div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{r.quantity} × {r.sareeType}</div>
                <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 2 }}>{r.reason}</div>
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: "#8B6018" }}>{formatINR(r.estimatedAmount)}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{r.requestedDate}</div>
              <span style={{
                fontFamily: F.ui, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                background: r.status === "approved" ? "rgba(30,102,64,0.09)" : r.status === "rejected" ? T.crimsonBg : "rgba(230,126,34,0.12)",
                color: r.status === "approved" ? T.greenMid : r.status === "rejected" ? T.crimson : "rgba(230,126,34,1)",
              }}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
