import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronRight, Building2, UserRound, Package, FileSpreadsheet, LayoutGrid, List } from "lucide-react";
import { Quotation } from "../contexts/FinishingContext";
import { Button } from "../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../shared/ui/data";
import { SectionCard } from "./common/primitives";

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

function formatDisplayDate(d?: string | null): string {
  if (!d) return "—";
  const str = String(d).trim();
  if (str.includes("T")) {
    return str.split("T")[0] ?? str;
  }
  return str;
}

function Pill({ label, color, bg, title, allowBreak }: { label: string; color: string; bg: string; title?: string; allowBreak?: boolean }) {
  return (
    <span
      title={title ?? label}
      style={{
        fontFamily: F.ui,
        fontWeight: 600,
        fontSize: 11,
        color,
        background: bg,
        borderRadius: 8,
        padding: "3px 8px",
        whiteSpace: allowBreak ? "normal" : "nowrap",
        wordBreak: allowBreak ? "break-all" : "normal",
        display: "inline-block",
        maxWidth: "100%",
        verticalAlign: "middle",
        lineHeight: 1.3,
      }}
    >
      {label}
    </span>
  );
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

const td: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "11px 12px", borderBottom: `1px solid rgba(110,15,45,0.06)`, verticalAlign: "middle" };
const tdMono: React.CSSProperties = { ...td, fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: T.royalBurgundy };

interface FinishingQuotationsSectionProps {
  filteredQuotations: Quotation[];
  openQuotation: string | null;
  setOpenQuotation: (id: string | null) => void;
}

type QuotationSaree = Quotation["sarees"][number];

const sareeColumns: ColumnDef<QuotationSaree>[] = [
  {
    id: "sareeId", header: "Saree Code", accessor: s => s.sareeId, priority: 1,
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
    id: "finishingStaffName", header: "Finishing Staff", accessor: s => s.finishingStaffName, priority: 3,
    cell: (_v, s) => s.finishingStaffName ? <span style={td}>{s.finishingStaffName}</span> : <span style={{ color: T.taupe, fontSize: 12 }}>—</span>,
  },
];

export function FinishingQuotationsSection({
  filteredQuotations,
  openQuotation,
  setOpenQuotation,
}: FinishingQuotationsSectionProps) {
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  return (
    <SectionCard
      icon={FileSpreadsheet}
      title="Quotations for Finishing"
      subtitle="Bulk-order quotations routed through finishing before dispatch — who raised them, who they're assigned to, and how many sarees have come back so far."
    >
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
              <div key={qt.id} style={{ border: `1px solid rgba(110,15,45,0.3)`, borderRadius: 14, overflow: "hidden" }}>
                <Button variant="ghost" onClick={() => setOpenQuotation(isOpen ? null : qt.id)}
                  className={`w-full h-auto justify-start text-left p-4 sm:p-4.5 rounded-none ${isOpen ? "bg-[rgba(110,15,45,0.04)]" : "bg-white"}`}>
                  <div className="w-full flex flex-col gap-2.5 min-w-0">
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>{qt.quotationNumber}</span>
                        <QuotationStatusBadge status={qt.status} />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 bg-[rgba(110,15,45,0.05)] px-2.5 py-1 rounded-lg">
                          <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Received:</span>
                          <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: 14, color: T.luxuryBrown }}>{received}/{qt.sarees.length}</span>
                        </div>
                        <div className="mt-0.5 shrink-0">
                          {isOpen ? <ChevronDown size={18} color={T.royalBurgundy} /> : <ChevronRight size={18} color={T.taupe} />}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 text-[12px]" style={{ fontFamily: F.ui, color: T.taupe }}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Building2 size={13} color={T.royalBurgundy} className="shrink-0" />
                        <span className="font-semibold text-[#3B2314]">{qt.customerName}</span>
                        {qt.customerCity && <span>· {qt.customerCity}</span>}
                        <span>· {formatDisplayDate(qt.quotationDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <UserRound size={13} color={T.taupe} className="shrink-0" />
                        <span>Raised by <strong style={{ color: T.luxuryBrown }}>{qt.raisedBy}</strong></span>
                        {qt.finishingStaffName && (
                          <span className="bg-[rgba(200,146,58,0.12)] text-[#8B6018] px-2 py-0.5 rounded-md font-semibold text-[11px] ml-1">
                            Assigned: {qt.finishingStaffName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", background: "#FFFDF9" }}>
                      <div className="p-3 sm:p-4 border-t border-[rgba(110,15,45,0.08)] flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
                          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe }}>
                            Sarees List ({qt.sarees.length})
                          </span>
                          <div className="flex md:hidden items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0">
                            <Button
                              onClick={() => setViewMode("card")}
                              variant="ghost"
                              className={`h-auto rounded-none gap-1.5 py-1.5 px-2.5 text-[12px] font-bold ${
                                viewMode === "card"
                                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
                              }`}
                            >
                              <LayoutGrid size={14} /> Card View
                            </Button>
                            <Button
                              onClick={() => setViewMode("table")}
                              variant="ghost"
                              className={`h-auto rounded-none gap-1.5 py-1.5 px-2.5 text-[12px] font-bold ${
                                viewMode === "table"
                                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
                              }`}
                            >
                              <List size={14} /> Table View
                            </Button>
                          </div>
                        </div>

                        <div className="w-full overflow-x-auto">
                          <DataTable
                            responsive={viewMode === "card"}
                            columns={sareeColumns}
                            data={qt.sarees}
                            getRowId={s => s.sareeId}
                            pagination
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
    </SectionCard>
  );
}
