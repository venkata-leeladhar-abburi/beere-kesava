import { useState, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { Users, ArrowDownToLine, FileText, Building2, ChevronDown, Phone, Receipt } from "lucide-react";
import { C, F } from "../tokens";
import { useFinishing, Quotation, QuotationSaree } from "@/features/finishing";
import { WORKER_NAME, Toast } from "./shared";
import { SectionCard } from "../primitives";
import { StaffPickerModal } from "./StaffPickerModal";
import { useSareeDetails, formatDate, formatWeight, type SareeDetail } from "./sareeDetails";
import { Button } from "../../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";
import { EntityCode, Money } from "@/shared/ui/domain";
import { rupees } from "@/lib/domain/money";
import { useAuth } from "../../../../../contexts/AuthContext";
import { LoadingState, ErrorState } from "../../../../../shared/ui/state";
import { STOPGAP_ACTING_USER_ID } from "../../../../../shared/api/purchase-requests";

// ── Quotations — assign for finishing & receive back against a quotation ───────

function QuotationStatusBadge({ status }: { status: Quotation["status"] }) {
  const cfg: Record<Quotation["status"], { bg: string; color: string; label: string }> = {
    "raised":              { bg: "rgba(200,146,58,0.14)", color: "#8B6018", label: "Awaiting Finishing" },
    "in-finishing":        { bg: "rgba(248,140,0,0.12)",  color: "#B85C00", label: "With Finishing Staff" },
    "partially-received":  { bg: "rgba(30,102,64,0.10)",  color: C.green,   label: "Partially Received" },
    "received":            { bg: "rgba(30,102,64,0.12)",  color: C.green,   label: "Received — Ready to Dispatch" },
    "dispatched":          { bg: "rgba(110,15,45,0.10)",  color: C.burg,    label: "Dispatched" },
  };
  const s = cfg[status];
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: "3px 10px", fontFamily: F.u, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" as const }}>{s.label}</span>
  );
}

const FINISHING_STATUS = {
  "pending":      { label: "Pending", fg: "#8D5802", bg: "rgba(200,155,71,0.14)", bd: "rgba(200,155,71,0.32)" },
  "in-finishing": { label: "In Finishing", fg: "#B85C00", bg: "rgba(248,140,0,0.12)", bd: "rgba(248,140,0,0.28)" },
  "received":     { label: "Received", fg: "#1F774E", bg: "rgba(30,102,64,0.10)", bd: "rgba(30,102,64,0.22)" },
} as const;

const GOLD: React.CSSProperties = {
  fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#845E04",
  background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.30)",
  borderRadius: 8, padding: "3px 9px", whiteSpace: "nowrap",
};

function Dash() {
  return <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>—</span>;
}

interface QuotationRow extends QuotationSaree {
  detail?: SareeDetail;
  price?: string;
}

// The saree list used to be three lines of loose text that printed the type
// code twice ("BS-004 · BS-004") and showed nothing about the loom, batch,
// weight or price the quotation was raised on. It is a real table now, joined
// to the batch row each saree came from.
function buildSareeColumns(): ColumnDef<QuotationRow>[] {
  return [
    {
      id: "sareeId", header: "Saree ID", accessor: r => r.sareeId, priority: 1, sortable: true,
      cell: (_v, r) => <EntityCode type="saree" value={r.sareeId} size="sm" copyable />,
    },
    {
      id: "producer", header: "Weaver / Loom", accessor: r => r.detail?.producerName ?? r.weaverName ?? "", priority: 2, sortable: true,
      cell: (_v, r) => {
        const name = r.detail?.producerName ?? (r.weaverName !== "—" ? r.weaverName : null);
        if (!name) return <Dash />;
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: F.u, fontSize: 13, color: C.text, whiteSpace: "nowrap" }}>{name}</span>
            {r.detail?.weaverCode && <span style={{ fontFamily: F.m, fontSize: 10, color: C.muted }}>{r.detail.weaverCode}</span>}
          </div>
        );
      },
    },
    {
      id: "loom", header: "Loom No.", accessor: r => r.detail?.loomLabel ?? "", priority: 3,
      cell: (_v, r) => r.detail?.loomLabel
        ? <span style={{ ...GOLD, color: C.burg, background: "rgba(110,15,45,0.07)", borderColor: "rgba(110,15,45,0.14)" }}>{r.detail.loomLabel}</span>
        : <Dash />,
    },
    {
      id: "batch", header: "Batch", accessor: r => r.detail?.batchId ?? "", priority: 3,
      cell: (_v, r) => r.detail?.batchId ? <EntityCode type="batch" value={r.detail.batchId} size="sm" /> : <Dash />,
    },
    {
      id: "type", header: "Saree Type", accessor: r => r.sareeTypeCode ?? r.detail?.sareeTypeCode ?? "", priority: 3, sortable: true,
      cell: (_v, r) => {
        const code = r.sareeTypeCode ?? r.detail?.sareeTypeCode ?? null;
        const name = r.detail?.sareeTypeName ?? (r.sareeType !== "—" ? r.sareeType : null);
        if (!code && !name) return <Dash />;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
            {code && <span style={GOLD}>{code}</span>}
            {name && name.toLowerCase() !== (code ?? "").toLowerCase() && (
              <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>{name}</span>
            )}
          </div>
        );
      },
    },
    {
      id: "weight", header: "Weight", accessor: r => r.detail?.weightG ?? 0, align: "end", priority: 3, sortable: true,
      cell: (_v, r) => (
        <span style={{ fontFamily: F.u, fontSize: 12, color: r.detail?.weightG != null ? C.text : C.muted, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {formatWeight(r.detail?.weightG)}
        </span>
      ),
    },
    {
      id: "color", header: "Colour", accessor: r => r.detail?.color ?? "", priority: 3,
      cell: (_v, r) => r.detail?.color ? <span style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>{r.detail.color}</span> : <Dash />,
    },
    {
      id: "price", header: "Price", accessor: r => Number(r.price ?? 0), align: "end", priority: 3, sortable: true,
      cell: (_v, r) => r.price != null
        ? <Money value={rupees(Number(r.price) || 0)} />
        : <Dash />,
    },
    {
      id: "staff", header: "Finishing Staff", accessor: r => r.finishingStaffName ?? "", priority: 2,
      cell: (_v, r) => r.finishingStaffName
        ? <span style={{ fontFamily: F.u, fontSize: 13, color: C.text, whiteSpace: "nowrap" }}>{r.finishingStaffName}</span>
        : <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Not assigned</span>,
    },
    {
      id: "status", header: "Status", accessor: r => r.finishingStatus, type: "status", priority: 1,
      cell: (_v, r) => {
        const cfg = FINISHING_STATUS[r.finishingStatus];
        return (
          <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: cfg.fg, background: cfg.bg, border: `1px solid ${cfg.bd}`, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>
            {cfg.label}
          </span>
        );
      },
    },
  ];
}

/** Two-line label/value used in the quotation header strip. */
function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: F.u, fontSize: 10, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
    </div>
  );
}

export function QuotationsSection({ isMobile }: { isMobile?: boolean }) {
  const { quotations, assignQuotationFinishing, receiveQuotationSarees, isLoading, isError, error, refetch } = useFinishing();
  const details = useSareeDetails();
  const { user } = useAuth();
  const actingUserId = user?.id ?? STOPGAP_ACTING_USER_ID;
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [expandedSarees, setExpandedSarees] = useState<Set<string>>(new Set());

  const columns = useMemo(buildSareeColumns, []);

  const toggleSareesExpanded = (id: string) => {
    setExpandedSarees(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const active = useMemo(
    () => quotations.filter(q => q.status !== "dispatched").sort((a, b) => b.createdAt - a.createdAt),
    [quotations]
  );

  const handleAssign = (staff: { id: string; name: string }) => {
    if (pickerFor) {
      const q = active.find(x => x.id === pickerFor);
      if (q) {
        const pendingIds = q.sarees.filter(s => s.finishingStatus === "pending").map(s => s.sareeId);
        if (pendingIds.length > 0) {
          assignQuotationFinishing(q.id, pendingIds, staff, actingUserId);
          setToast(`${pendingIds.length} saree${pendingIds.length > 1 ? "s" : ""} assigned to ${staff.name} for finishing`);
        }
      }
    }
    setPickerFor(null);
  };

  const handleReceive = (q: Quotation) => {
    const inFinishingIds = q.sarees.filter(s => s.finishingStatus === "in-finishing").map(s => s.sareeId);
    if (inFinishingIds.length === 0) return;
    receiveQuotationSarees(q.id, inFinishingIds, WORKER_NAME);
    setToast(`${inFinishingIds.length} saree${inFinishingIds.length > 1 ? "s" : ""} received against ${q.quotationNumber}`);
  };

  return (
    <SectionCard
      icon={FileText}
      title="Quotations for Finishing"
      subtitle="Orders raised from Inventory that need finishing work."
      actions={
        <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#FFFDF9", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.20)", padding: "5px 12px", borderRadius: 999 }}>
          {active.length} active
        </span>
      }
    >
      {isLoading ? (
        <LoadingState variant="skeleton" rows={4} />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : active.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>
          No quotations awaiting finishing.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {active.map(q => {
            const received = q.sarees.filter(s => s.finishingStatus === "received").length;
            const pendingSarees = q.sarees.filter(s => s.finishingStatus === "pending");
            const inFinishingSarees = q.sarees.filter(s => s.finishingStatus === "in-finishing");
            const canAssign = pendingSarees.length > 0;
            const canReceive = inFinishingSarees.length > 0;
            const isOpen = expandedSarees.has(q.id);
            const rows: QuotationRow[] = q.sarees.map(s => ({
              ...s,
              detail: details.get(s.sareeId),
              price: q.prices[s.sareeId],
            }));
            const totalWeight = rows.reduce((sum, r) => sum + (r.detail?.weightG ?? 0), 0);

            return (
              <div key={q.id} style={{ border: `1px solid rgba(110,15,45,0.18)`, borderRadius: 16, overflow: "hidden", background: "#FFF", boxShadow: "0 1px 2px rgba(74,6,27,0.03), 0 6px 18px rgba(74,6,27,0.05)" }}>
                {/* Header */}
                <div className="flex items-start gap-3 p-3 sm:p-4 bg-[rgba(110,15,45,0.03)] border-b border-[rgba(110,15,45,0.08)] w-full">
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <FileText size={20} color={C.burg} />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 w-full flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{q.quotationNumber}</span>
                        <QuotationStatusBadge status={q.status} />
                      </div>
                      <div style={{ fontFamily: F.d, fontWeight: 800, fontSize: 16, color: C.text }} className="shrink-0">
                        {received}/{q.sarees.length} <span style={{ fontFamily: F.u, fontSize: 11, fontWeight: 400, color: C.muted }}>received</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] flex-wrap">
                      <Building2 size={12} className="shrink-0" />
                      <span className="font-medium text-[var(--text-primary)]">{q.customerName}</span>
                      {q.customerCity && <span>· {q.customerCity}</span>}
                      {q.customerPhone && (
                        <span className="inline-flex items-center gap-1">· <Phone size={11} /> {q.customerPhone}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quotation facts — the raw ISO timestamp used to be printed verbatim here */}
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
                  style={{ gap: 12, padding: "12px 16px", borderBottom: `1px solid rgba(110,15,45,0.08)`, background: "#FFF" }}
                >
                  <Fact label="Raised on" value={formatDate(q.quotationDate)} />
                  <Fact label="Raised by" value={q.raisedBy} />
                  <Fact label="Sarees" value={`${q.sarees.length} · ${totalWeight > 0 ? formatWeight(totalWeight) : "weight n/a"}`} />
                  <Fact label="Bulk order" value={q.bulkOrderRef ?? "General stock"} />
                  <Fact
                    label={q.applyGst ? `Total (incl. ${q.gstPct}% GST)` : "Total"}
                    value={<Money value={rupees(q.grandTotal)} />}
                  />
                  <Fact
                    label="Finishing"
                    value={q.finishingStaffName ?? <span style={{ color: C.muted, fontWeight: 400 }}>Not assigned</span>}
                  />
                </div>

                {/* Sarees — collapsed by default so a big quotation doesn't eat the whole page */}
                <div>
                  <div
                    onClick={() => toggleSareesExpanded(q.id)}
                    role="button" tabIndex={0} aria-expanded={isOpen}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSareesExpanded(q.id); } }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 16px", cursor: "pointer", background: isOpen ? "rgba(110,15,45,0.02)" : "transparent" }}
                  >
                    <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text, display: "inline-flex", alignItems: "center", gap: 7 }}>
                      <Receipt size={14} color={C.muted} />
                      {q.sarees.length} saree{q.sarees.length !== 1 ? "s" : ""} in this quotation
                      {pendingSarees.length > 0 && (
                        <span style={{ ...GOLD, borderRadius: 999, fontSize: 11 }}>{pendingSarees.length} pending</span>
                      )}
                      {inFinishingSarees.length > 0 && (
                        <span style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: "#B85C00", background: "rgba(248,140,0,0.12)", border: "1px solid rgba(248,140,0,0.28)", borderRadius: 999, padding: "3px 9px" }}>
                          {inFinishingSarees.length} in finishing
                        </span>
                      )}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.burg }}>{isOpen ? "Hide" : "Show"}</span>
                      <ChevronDown size={14} color={C.muted} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ borderTop: `1px solid rgba(110,15,45,0.06)`, padding: isMobile ? 10 : 12, background: "rgba(110,15,45,0.015)" }}>
                      <div className="overflow-x-auto section-nav-scroll">
                        <div className={isMobile ? "min-w-[900px]" : "min-w-[1040px]"}>
                          <DataTable columns={columns} data={rows} getRowId={r => r.sareeId} density="compact" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {(canAssign || canReceive) && (
                  <div className="flex items-center gap-1.5 sm:gap-2 p-3 sm:p-4 border-t border-[rgba(110,15,45,0.08)] w-full flex-nowrap min-w-0">
                    {canAssign && (
                      <Button variant="primary" iconLeft={Users} onClick={() => setPickerFor(q.id)}
                        className="flex-1 min-w-0 px-2 text-[12px] whitespace-nowrap justify-center h-[38px] rounded-xl bg-[#6E0F2D] hover:bg-[#6E0F2D]">
                        Assign {pendingSarees.length} to Finishing
                      </Button>
                    )}
                    {canReceive && (
                      <Button variant="primary" iconLeft={ArrowDownToLine} onClick={() => handleReceive(q)}
                        className="flex-1 min-w-0 px-2 text-[12px] whitespace-nowrap justify-center h-[38px] rounded-xl bg-gradient-to-br from-[#1E5A3A] to-[#1E6640] text-xs font-bold">
                        Receive {inFinishingSarees.length} Back
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {pickerFor && <StaffPickerModal onSelect={handleAssign} onClose={() => setPickerFor(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <Toast msg={toast} onDone={() => setToast("")} />}
      </AnimatePresence>
    </SectionCard>
  );
}
