import React, { useContext, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Tag, Layers, FileText, Boxes, Calendar, Package, ArrowRight, CheckCircle2,
  Filter, ChevronDown, ChevronUp, Check, LayoutList, LayoutGrid, QrCode,
} from "lucide-react";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER } from "../../../../shared/ui/DateFilterBar";
import { T, F, EASE, MobileCtx } from "../theme";
import { STATUS_CFG, MAT_TAG, BATCH_DATA, MAT_FILTERS, STATUS_FILTERS, STATUS_FILTER_MAP } from "../data";
import type { BatchRow } from "../types";
import { SectionHeader, FadeUp } from "../common/primitives";
import { BatchViewDetailsModal, PrintBarcodeModal } from "../modals/StockModals";
import { Button, SearchInput } from "../../../../shared/ui/primitives";

export function BatchTableView({ rows, onViewDetails, onPrintBarcode }: { rows: BatchRow[]; onViewDetails: (b: BatchRow) => void; onPrintBarcode: (b: BatchRow) => void }) {
  const TH: React.CSSProperties = { fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe, letterSpacing: "0.6px", textTransform: "uppercase" as const, padding: "14px 16px", textAlign: "left" as const, whiteSpace: "nowrap" as const, borderBottom: `1px solid rgba(110,15,45,0.08)`, background: T.silkCream };
  const TD: React.CSSProperties = { padding: "14px 16px", borderBottom: "1px solid rgba(110,15,45,0.05)", verticalAlign: "middle" as const };
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.05)", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1020 }}>
        <thead>
          <tr>
            {[
              { label: "Batch ID",    icon: <Tag size={12} /> },
              { label: "Material",    icon: <Layers size={12} /> },
              { label: "Description", icon: <FileText size={12} /> },
              { label: "Vendor",      icon: <Boxes size={12} /> },
              { label: "Received On", icon: <Calendar size={12} /> },
              { label: "Received",    icon: <Package size={12} /> },
              { label: "Given",       icon: <ArrowRight size={12} /> },
              { label: "Remaining",   icon: <CheckCircle2 size={12} /> },
              { label: "Status",      icon: null },
              { label: "Actions",     icon: null },
            ].map(h => (
              <th key={h.label} style={TH}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {h.icon}<span>{h.label}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const sc = STATUS_CFG[r.statusType];
            const mt = MAT_TAG[r.type];
            const remPct = r.received > 0 ? Math.round((r.remaining / r.received) * 100) : 0;
            return (
              <motion.tr
                key={r.id}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.03, ease: EASE }}
                style={{ background: i % 2 === 0 ? "#FFFFFF" : T.warmIvory }}
              >
                <td style={TD}>
                  <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, letterSpacing: "0.2px", background: "rgba(110,15,45,0.05)", padding: "4px 8px", borderRadius: 6, display: "inline-block" }}>{r.id}</span>
                </td>
                <td style={TD}>
                  <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: mt.col, background: mt.bg, padding: "5px 11px", borderRadius: 20, letterSpacing: "0.3px" }}>{r.type}</span>
                </td>
                <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{r.details}</span></td>
                <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{r.vendor}</span></td>
                <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{r.date}</span></td>
                <td style={TD}>
                  <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>
                    {r.received} <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 400, color: T.taupe }}>{r.type === "Jari" ? `Buns (${r.received * 4} Reels)` : "kg"}</span>
                  </span>
                </td>
                <td style={TD}>
                  <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.taupe }}>
                    {r.given} <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 400 }}>{r.type === "Jari" ? `Buns (${r.given * 4} Reels)` : "kg"}</span>
                  </span>
                </td>
                <td style={TD}>
                  <div>
                    <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: sc.color }}>
                      {r.remaining} <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 400 }}>{r.type === "Jari" ? `Buns (${r.remaining * 4} Reels)` : "kg"}</span>
                    </span>
                    <div style={{ width: 64, height: 4, background: "rgba(110,15,45,0.08)", borderRadius: 2, marginTop: 5 }}>
                      <div style={{ width: `${remPct}%`, height: "100%", background: sc.dot, borderRadius: 2 }} />
                    </div>
                  </div>
                </td>
                <td style={TD}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: sc.bg, color: sc.color, fontFamily: F.ui, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 20, whiteSpace: "nowrap" as const }}>
                    {sc.icon} {sc.text}
                  </span>
                </td>
                <td style={TD}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Button onClick={() => onViewDetails(r)} variant="secondary" size="sm" iconLeft={FileText}>
                      View Details
                    </Button>
                    <Button onClick={() => onPrintBarcode(r)} variant="primary" size="sm" iconLeft={QrCode}>
                      Print Barcode
                    </Button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function BatchCardView({ rows, onViewDetails, onPrintBarcode }: { rows: BatchRow[]; onViewDetails: (b: BatchRow) => void; onPrintBarcode: (b: BatchRow) => void }) {
  const { isMobile } = useContext(MobileCtx);
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 14 : 20, alignItems: "stretch" }}>
      {rows.map((r, i) => {
        const sc = STATUS_CFG[r.statusType];
        const mt = MAT_TAG[r.type];
        const remPct = r.received > 0 ? Math.round((r.remaining / r.received) * 100) : 0;
        const matIcon = r.type === "Warp" ? <Layers size={22} color={mt.col} /> : r.type === "Resham" ? <Tag size={22} color={mt.col} /> : <Boxes size={22} color={mt.col} />;
        return (
          <FadeUp key={r.id} delay={i * 0.05} style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ background: mt.bg, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid rgba(110,15,45,0.07)` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
                    {matIcon}
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: mt.col }}>{r.type}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>{r.details}</div>
                  </div>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: sc.bg, color: sc.color, fontFamily: F.ui, fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 20 }}>
                  {sc.icon} {sc.text}
                </span>
              </div>
              <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, background: "rgba(110,15,45,0.05)", display: "inline-block", padding: "3px 8px", borderRadius: 6, marginBottom: 8, letterSpacing: "0.3px" }}>{r.id}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{r.vendor}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                    <Calendar size={12} color={T.taupe} />
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Received {r.date}</span>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                  {[
                    { icon: <Package size={13} color={T.taupe} />, label: "Received", val: r.received, color: T.luxuryBrown },
                    { icon: <ArrowRight size={13} color={T.taupe} />, label: "Given", val: r.given, color: T.taupe },
                    { icon: <CheckCircle2 size={13} color={sc.color} />, label: "Remaining", val: r.remaining, color: sc.color },
                  ].map(s => (
                    <div key={s.label} style={{ background: T.silkCream, borderRadius: 10, padding: "10px 10px 8px", textAlign: "center" as const }}>
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>{s.icon}</div>
                      <div style={{ fontFamily: F.display, fontSize: r.type === "Jari" ? 14 : 18, fontWeight: 700, color: s.color, lineHeight: 1.2 }}>
                        {r.type === "Jari" ? (
                          <>
                            <div>{s.val} Buns</div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: T.taupe, marginTop: 2 }}>{s.val * 4} Reels</div>
                          </>
                        ) : (
                          s.val
                        )}
                      </div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>
                        {s.label} {r.type === "Jari" ? "" : "kg"}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 16, flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Stock remaining</span>
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: sc.color }}>{remPct}%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(110,15,45,0.08)", borderRadius: 3 }}>
                    <div style={{ width: `${remPct}%`, height: "100%", background: sc.dot, borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button onClick={() => onViewDetails(r)} variant="secondary" size="sm" iconLeft={FileText} className="flex-1">
                    View Details
                  </Button>
                  <Button onClick={() => onPrintBarcode(r)} variant="primary" size="sm" iconLeft={QrCode} className="flex-1">
                    Print Barcode
                  </Button>
                </div>
              </div>
            </div>
          </FadeUp>
        );
      })}
    </div>
  );
}

export function BatchesSection({ onAddNewStock }: { onAddNewStock: () => void }) {
  const { isMobile, px } = useContext(MobileCtx);
  const [view, setView] = useState<"table" | "card">(isMobile ? "card" : "table");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [matFilter, setMatFilter] = useState("All Materials");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [search, setSearch] = useState("");
  const [statusDropOpen, setStatusDropOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchRow | null>(null);
  const [barcodeBatch, setBarcodeBatch] = useState<BatchRow | null>(null);

  const filtered = BATCH_DATA.filter(b => {
    const matchMat = matFilter === "All Materials" || b.type === matFilter.replace(" Only", "");
    const matchStatus = statusFilter === "All Status" || b.statusType === STATUS_FILTER_MAP[statusFilter];
    const matchSearch = search === "" || b.id.toLowerCase().includes(search.toLowerCase()) || b.vendor.toLowerCase().includes(search.toLowerCase());
    return matchMat && matchStatus && matchSearch;
  });

  return (
    <section style={{ padding: `44px ${px}px 0` }}>
      <SectionHeader
        title="All Material Batches in Stock"
        action="Receive Materials"
        actionIcon={<Package size={15} />}
        onAction={onAddNewStock}
        actionVariant="solid"
      />
      <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: T.taupe, margin: "0 0 20px", lineHeight: 1.6 }}>
        Each batch is one delivery of material received from a vendor. Every batch has its own unique barcode for tracking.
      </p>

      <div style={{ marginBottom: 16 }}>
        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
      </div>

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: 16, gap: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {MAT_FILTERS.map(f => (
            <Button
              key={f}
              onClick={() => setMatFilter(f)}
              variant={matFilter === f ? "primary" : "secondary"}
              size="sm"
              className="rounded-full"
            >
              {f}
            </Button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: isMobile ? 1 : "none", width: isMobile ? "100%" : 240 }}>
            <SearchInput
              value={search}
              onChange={e => setSearch(e.target.value)}
              onSearch={setSearch}
              placeholder={isMobile ? "Search batch / vendor..." : "Search by batch number or vendor name..."}
            />
          </div>

          <div style={{ position: "relative" }}>
            <Button
              onClick={() => setStatusDropOpen(o => !o)}
              variant={statusFilter !== "All Status" ? "primary" : "secondary"}
              size="sm"
              iconLeft={Filter}
              iconRight={statusDropOpen ? ChevronUp : ChevronDown}
            >
              {statusFilter}
            </Button>
            <AnimatePresence>
              {statusDropOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 200,
                    background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`,
                    boxShadow: "0 12px 40px rgba(74,6,27,0.15)", minWidth: 160, overflow: "hidden",
                  }}
                >
                  {STATUS_FILTERS.map(f => {
                    const colors: Record<string, string> = { "In Stock": T.green, "Running Low": "#7A5E1C", "Very Low": T.crimson, "All Used Up": T.taupe, "All Status": T.luxuryBrown };
                    return (
                      <Button
                        key={f}
                        onClick={() => { setStatusFilter(f); setStatusDropOpen(false); }}
                        variant="ghost"
                        size="sm"
                        fullWidth
                        className={`justify-start rounded-none ${statusFilter === f ? "font-bold" : "font-medium"}`}
                      >
                        {f !== "All Status" && (
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors[f], flexShrink: 0 }} />
                        )}
                        <span style={{ color: statusFilter === f ? colors[f] : T.luxuryBrown }}>{f}</span>
                        {statusFilter === f && <Check size={13} color={colors[f]} style={{ marginLeft: "auto" }} />}
                      </Button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            {([["table", LayoutList, "Table"], ["card", LayoutGrid, "Card"]] as const).map(([v, Icon, label]) => (
              <Button
                key={v}
                onClick={() => setView(v as "table" | "card")}
                variant={view === v ? "primary" : "secondary"}
                size="sm"
                iconLeft={Icon}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {(statusFilter !== "All Status" || matFilter !== "All Materials" || search) && (
        <div style={{ marginBottom: 12, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
          Showing <strong style={{ color: T.luxuryBrown }}>{filtered.length}</strong> of {BATCH_DATA.length} batches
          {statusFilter !== "All Status" && <> · Status: <strong style={{ color: T.royalBurgundy }}>{statusFilter}</strong></>}
        </div>
      )}

      <FadeUp>
        {view === "table"
          ? <BatchTableView rows={filtered} onViewDetails={setSelectedBatch} onPrintBarcode={setBarcodeBatch} />
          : <BatchCardView rows={filtered} onViewDetails={setSelectedBatch} onPrintBarcode={setBarcodeBatch} />
        }
      </FadeUp>

      <BatchViewDetailsModal batch={selectedBatch} onClose={() => setSelectedBatch(null)} />
      <PrintBarcodeModal batch={barcodeBatch} onClose={() => setBarcodeBatch(null)} />
    </section>
  );
}
