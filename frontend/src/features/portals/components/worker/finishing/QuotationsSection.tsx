import { useState, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { Users, Package, ArrowDownToLine, FileText, Building2, ChevronDown } from "lucide-react";
import { C, F } from "../tokens";
import { useFinishing, Quotation } from "@/features/finishing";
import { WORKER_NAME, Toast } from "./shared";
import { SectionCard } from "../primitives";
import { StaffPickerModal } from "./StaffPickerModal";
import { Button } from "../../../../../shared/ui/primitives";
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

export function QuotationsSection(_props: { isMobile?: boolean }) {
  const { quotations, assignQuotationFinishing, receiveQuotationSarees, isLoading, isError, error, refetch } = useFinishing();
  const { user } = useAuth();
  const actingUserId = user?.id ?? STOPGAP_ACTING_USER_ID;
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [expandedSarees, setExpandedSarees] = useState<Set<string>>(new Set());

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
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {active.map(q => {
            const received = q.sarees.filter(s => s.finishingStatus === "received").length;
            const pendingSarees = q.sarees.filter(s => s.finishingStatus === "pending");
            const inFinishingSarees = q.sarees.filter(s => s.finishingStatus === "in-finishing");
            const canAssign = pendingSarees.length > 0;
            const canReceive = inFinishingSarees.length > 0;

            return (
              <div key={q.id} style={{ border: `1px solid rgba(110,15,45,0.12)`, borderRadius: 14, overflow: "hidden", background: "#FFF" }}>
                {/* Header */}
                <div className="flex items-start gap-3 p-2.5 sm:p-3.5 bg-[rgba(110,15,45,0.03)] border-b border-[rgba(110,15,45,0.08)] w-full">
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <FileText size={20} color={C.burg} />
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
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
                      <span>· {q.quotationDate}</span>
                    </div>
                    {q.finishingStaffName && (
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Finishing: <strong style={{ color: C.text }}>{q.finishingStaffName}</strong></div>
                    )}
                  </div>
                </div>

                {/* Sarees — collapsed by default so a big quotation doesn't eat the whole page */}
                {(() => {
                  const isOpen = expandedSarees.has(q.id);
                  return (
                    <div>
                      <div
                        onClick={() => toggleSareesExpanded(q.id)}
                        role="button" tabIndex={0}
                        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSareesExpanded(q.id); } }}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 12px", cursor: "pointer", background: isOpen ? "rgba(110,15,45,0.02)" : "transparent" }}
                      >
                        <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text }}>
                          {q.sarees.length} saree{q.sarees.length !== 1 ? "s" : ""}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.burg }}>
                            {isOpen ? "Hide" : "Show"}
                          </span>
                          <ChevronDown size={14} color={C.muted} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                        </div>
                      </div>
                      {isOpen && (
                        <div style={{ borderTop: `1px solid rgba(110,15,45,0.06)` }}>
                          {q.sarees.map((s, i) => {
                            return (
                              <div key={s.sareeId}
                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 12px", borderBottom: i < q.sarees.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none" }}
                              >
                                <Package size={14} color={C.muted} style={{ flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.burg }}>{s.sareeId}</div>
                                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{s.sareeTypeCode || s.designCode} · {s.sareeType}</div>
                                </div>
                                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                                  <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: s.finishingStatus === "received" ? C.green : s.finishingStatus === "in-finishing" ? "#B85C00" : C.muted }}>
                                    {s.finishingStatus === "received" ? "Received" : s.finishingStatus === "in-finishing" ? "In Finishing" : "Pending"}
                                  </span>
                                  {s.finishingStaffName && (
                                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>{s.finishingStaffName}</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Actions */}
                {(canAssign || canReceive) && (
                  <div className="flex items-center gap-1.5 sm:gap-2 p-3 sm:p-4 border-t border-[rgba(110,15,45,0.08)] w-full flex-nowrap min-w-0">
                    {canAssign && (
                      <Button variant="primary" iconLeft={Users} onClick={() => setPickerFor(q.id)}
                        className="flex-1 min-w-0 px-2 text-[12px] whitespace-nowrap justify-center h-[38px] rounded-xl bg-[#6E0F2D] hover:bg-[#6E0F2D]">
                        Assign ({pendingSarees.length})
                      </Button>
                    )}
                    {canReceive && (
                      <Button variant="primary" iconLeft={ArrowDownToLine} onClick={() => handleReceive(q)}
                        className="flex-1 min-w-0 px-2 text-[12px] whitespace-nowrap justify-center h-[38px] rounded-xl bg-gradient-to-br from-[#1E5A3A] to-[#1E6640] text-xs font-bold">
                        Receive ({inFinishingSarees.length})
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
