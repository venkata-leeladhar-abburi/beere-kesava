import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronRight, Building2, UserRound, Package } from "lucide-react";
import { Quotation } from "../contexts/FinishingContext";
import { Button } from "../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../shared/ui/data";

const T = {
  royalBurgundy: "#6E0F2D",
  luxuryBrown:   "#3B2314",
  taupe:         "#69635E",
  crimson:       "#C0392B",
  green:         "#1E6640",
  orange:        "#E67E22",
  borderDef:     "rgba(110,15,45,0.10)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color, background: bg, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>{label}</span>;
}

function QuotationStatusBadge({ status }: { status: Quotation["status"] }) {
  const cfg: Record<Quotation["status"], { bg: string; color: string; label: string }> = {
    "raised":              { bg: "rgba(200,146,58,0.14)", color: "#8B6018", label: "Awaiting Finishing" },
    "in-finishing":        { bg: "rgba(248,140,0,0.12)",  color: "#B85C00", label: "With Finishing Staff" },
    "partially-received":  { bg: "rgba(30,102,64,0.10)",  color: T.green,   label: "Partially Received" },
    "received":            { bg: "rgba(30,102,64,0.12)",  color: T.green,   label: "Received — Ready to Dispatch" },
    "dispatched":          { bg: "rgba(107,26,42,0.10)",  color: T.royalBurgundy, label: "Dispatched" },
  };
  const s = cfg[status];
  return <Pill label={s.label} color={s.color} bg={s.bg} />;
}

const th: React.CSSProperties = { fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", textAlign: "left", padding: "10px 12px", borderBottom: `1.5px solid ${T.borderDef}`, whiteSpace: "nowrap" };
const td: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "11px 12px", borderBottom: `1px solid rgba(110,15,45,0.06)`, verticalAlign: "middle" };
const tdMono: React.CSSProperties = { ...td, fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy };

interface FinishingQuotationsSectionProps {
  filteredQuotations: Quotation[];
  openQuotation: string | null;
  setOpenQuotation: (id: string | null) => void;
}

type QuotationSaree = Quotation["sarees"][number];

const sareeColumns: ColumnDef<QuotationSaree>[] = [
  {
    id: "sareeId", header: "Saree Code", accessor: s => s.sareeId,
    cell: (_v, s) => <span style={tdMono}>{s.sareeId}</span>,
  },
  {
    id: "sareeType", header: "Saree Type", accessor: s => s.sareeType,
    cell: (_v, s) => <span style={td}>{s.sareeTypeCode ? `${s.sareeTypeCode} · ` : ""}{s.sareeType}</span>,
  },
  {
    id: "weaverName", header: "Weaver", accessor: s => s.weaverName,
    cell: (_v, s) => <span style={td}>{s.weaverName}</span>,
  },
  {
    id: "finishingStatus", header: "Finishing Status", accessor: s => s.finishingStatus,
    cell: (_v, s) => (
      <Pill
        label={s.finishingStatus === "received" ? "Received" : s.finishingStatus === "in-finishing" ? "In Finishing" : "Pending"}
        color={s.finishingStatus === "received" ? T.green : s.finishingStatus === "in-finishing" ? T.orange : T.taupe}
        bg={s.finishingStatus === "received" ? "rgba(30,102,64,0.09)" : s.finishingStatus === "in-finishing" ? "rgba(230,126,34,0.12)" : "rgba(139,112,96,0.10)"}
      />
    ),
  },
  {
    id: "finishingStaffName", header: "Finishing Staff", accessor: s => s.finishingStaffName,
    cell: (_v, s) => s.finishingStaffName ? <span style={td}>{s.finishingStaffName}</span> : <span style={{ color: T.taupe, fontSize: 12 }}>—</span>,
  },
];

export function FinishingQuotationsSection({
  filteredQuotations,
  openQuotation,
  setOpenQuotation,
}: FinishingQuotationsSectionProps) {
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(74,6,27,0.06)", padding: 22 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown, margin: 0 }}>Quotations for Finishing</h3>
        <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: "5px 0 0" }}>
          Bulk-order quotations routed through finishing before dispatch — who raised them, who they're assigned to, and how many sarees have come back so far.
        </p>
      </div>

      {filteredQuotations.length === 0 ? (
        <div style={{ padding: "48px 24px", textAlign: "center" }}>
          <Package size={40} color={T.taupe} style={{ opacity: 0.45, marginBottom: 12 }} />
          <div style={{ fontFamily: F.display, fontSize: 16, color: T.taupe }}>No quotations match the current filters.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredQuotations.map(qt => {
            const isOpen = openQuotation === qt.id;
            const received = qt.sarees.filter(s => s.finishingStatus === "received").length;
            return (
              <div key={qt.id} style={{ border: `1px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden" }}>
                <Button variant="ghost" onClick={() => setOpenQuotation(isOpen ? null : qt.id)}
                  className={`w-full h-auto justify-start text-left gap-3.5 py-3.5 px-[18px] rounded-none ${isOpen ? "bg-[rgba(110,15,45,0.04)]" : "bg-white"}`}>
                  {isOpen ? <ChevronDown size={17} color={T.royalBurgundy} /> : <ChevronRight size={17} color={T.taupe} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>{qt.quotationNumber}</span>
                      <QuotationStatusBadge status={qt.status} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                      <Building2 size={12} color={T.taupe} /> {qt.customerName}{qt.customerCity ? ` · ${qt.customerCity}` : ""} · {qt.quotationDate}
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                      <UserRound size={12} color={T.taupe} /> Raised by <strong style={{ color: T.luxuryBrown }}>{qt.raisedBy}</strong>
                      {qt.finishingStaffName && <> · Assigned to <strong style={{ color: T.luxuryBrown }}>{qt.finishingStaffName}</strong></>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 20, color: T.luxuryBrown, lineHeight: 1 }}>{received}/{qt.sarees.length}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.7px", marginTop: 3 }}>Received</div>
                  </div>
                </Button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", background: "#FFFDF9" }}>
                      <div style={{ padding: "6px 18px 16px" }}>
                        <div style={{ overflowX: "auto", minWidth: 680 }}>
                          <DataTable
                            columns={sareeColumns}
                            data={qt.sarees}
                            getRowId={s => s.sareeId}
                            emptyTitle="No sarees on this quotation"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
