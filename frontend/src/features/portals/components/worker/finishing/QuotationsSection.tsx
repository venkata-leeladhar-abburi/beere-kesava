import { useState, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { CheckSquare, Square, Users, X, Package, ArrowDownToLine, FileText, Building2 } from "lucide-react";
import { C, F, card } from "../tokens";
import { useFinishing, Quotation } from "../../../../finishing/contexts/FinishingContext";
import { WORKER_NAME, SectionHeader, Toast } from "./shared";
import { StaffPickerModal } from "./StaffPickerModal";
import { Button, IconButton } from "../../../../../shared/ui/primitives";

// ── Quotations — assign for finishing & receive back against a quotation ───────

function QuotationStatusBadge({ status }: { status: Quotation["status"] }) {
  const cfg: Record<Quotation["status"], { bg: string; color: string; label: string }> = {
    "raised":              { bg: "rgba(200,146,58,0.14)", color: "#8B6018", label: "Awaiting Finishing" },
    "in-finishing":        { bg: "rgba(248,140,0,0.12)",  color: "#B85C00", label: "With Finishing Staff" },
    "partially-received":  { bg: "rgba(30,102,64,0.10)",  color: C.green,   label: "Partially Received" },
    "received":            { bg: "rgba(30,102,64,0.12)",  color: C.green,   label: "Received — Ready to Dispatch" },
    "dispatched":          { bg: "rgba(107,26,42,0.10)",  color: C.burg,    label: "Dispatched" },
  };
  const s = cfg[status];
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: "3px 10px", fontFamily: F.u, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" as const }}>{s.label}</span>
  );
}

export function QuotationsSection({ isMobile }: { isMobile?: boolean }) {
  const { quotations, assignQuotationFinishing, receiveQuotationSarees } = useFinishing();
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, Set<string>>>({});
  const [toast, setToast] = useState("");

  const active = useMemo(
    () => quotations.filter(q => q.status !== "dispatched").sort((a, b) => b.createdAt - a.createdAt),
    [quotations]
  );

  const selectionFor = (qid: string) => selections[qid] ?? new Set<string>();

  const statusOf = (q: Quotation, sareeId: string) => q.sarees.find(s => s.sareeId === sareeId)?.finishingStatus;

  // Toggling a row clears the selection if it would mix pending + in-finishing sarees —
  // assigning and receiving are different actions and can't be done in the same click.
  const toggleSaree = (q: Quotation, sareeId: string) => {
    setSelections(prev => {
      const current = new Set(prev[q.id] ?? []);
      if (current.has(sareeId)) {
        current.delete(sareeId);
      } else {
        const clickedStatus = statusOf(q, sareeId);
        const existingStatus = current.size > 0 ? statusOf(q, [...current][0]) : undefined;
        if (existingStatus && existingStatus !== clickedStatus) current.clear();
        current.add(sareeId);
      }
      return { ...prev, [q.id]: current };
    });
  };

  const selectAllOfStatus = (q: Quotation, status: "pending" | "in-finishing") => {
    setSelections(prev => ({ ...prev, [q.id]: new Set(q.sarees.filter(s => s.finishingStatus === status).map(s => s.sareeId)) }));
  };

  const clearSelection = (qid: string) => setSelections(prev => ({ ...prev, [qid]: new Set() }));

  const handleAssign = (staff: { id: string; name: string }) => {
    if (pickerFor) {
      const ids = [...selectionFor(pickerFor)];
      assignQuotationFinishing(pickerFor, ids, staff, WORKER_NAME);
      setToast(`${ids.length} saree${ids.length > 1 ? "s" : ""} assigned to ${staff.name} for finishing`);
      clearSelection(pickerFor);
    }
    setPickerFor(null);
  };

  const handleReceive = (q: Quotation) => {
    const ids = [...selectionFor(q.id)];
    if (ids.length === 0) return;
    receiveQuotationSarees(q.id, ids, WORKER_NAME);
    setToast(`${ids.length} saree${ids.length > 1 ? "s" : ""} received against ${q.quotationNumber}`);
    clearSelection(q.id);
  };

  return (
    <div style={{ ...card, padding: 16, marginBottom: 16 }}>
      <SectionHeader
        icon={<FileText size={18} color={C.burg} />}
        title="Quotations for Finishing"
        count={active.length}
        accent="rgba(107,26,42,0.09)"
      />
      {active.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>
          No quotations awaiting finishing.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {active.map(q => {
            const received = q.sarees.filter(s => s.finishingStatus === "received").length;
            const pendingSarees = q.sarees.filter(s => s.finishingStatus === "pending");
            const inFinishingSarees = q.sarees.filter(s => s.finishingStatus === "in-finishing");
            const selected = selectionFor(q.id);
            const selectionStatus = selected.size > 0 ? statusOf(q, [...selected][0]) : undefined;
            const canAssign = selectionStatus === "pending";
            const canReceive = selectionStatus === "in-finishing";
            return (
              <div key={q.id} style={{ border: `1px solid rgba(107,26,42,0.12)`, borderRadius: 14, overflow: "hidden", background: "#FFF" }}>
                {/* Header */}
                <div style={{ padding: "12px 14px", background: "rgba(107,26,42,0.03)", borderBottom: `1px solid rgba(107,26,42,0.08)`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" as const }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{q.quotationNumber}</span>
                      <QuotationStatusBadge status={q.status} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontFamily: F.u, fontSize: 12, color: C.muted }}>
                      <Building2 size={12} color={C.muted} /> {q.customerName}{q.customerCity ? ` · ${q.customerCity}` : ""} · {q.quotationDate}
                    </div>
                    {q.finishingStaffName && (
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>Finishing: <strong style={{ color: C.text }}>{q.finishingStaffName}</strong></div>
                    )}
                  </div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, textAlign: "right" as const }}>
                    <div style={{ fontFamily: F.d, fontWeight: 800, fontSize: 18, color: C.text, lineHeight: 1 }}>{received}/{q.sarees.length}</div>
                    received
                  </div>
                </div>

                {/* Select-all shortcuts */}
                {(pendingSarees.length > 0 || inFinishingSarees.length > 0) && (
                  <div style={{ display: "flex", gap: 14, padding: "8px 14px 0", flexWrap: "wrap" as const }}>
                    {pendingSarees.length > 0 && (
                      <Button variant="link" onClick={() => selectAllOfStatus(q, "pending")} className="gap-1 p-0 text-xs text-[#69635E]">
                        <CheckSquare size={13} color={C.muted} /> Select all pending ({pendingSarees.length})
                      </Button>
                    )}
                    {inFinishingSarees.length > 0 && (
                      <Button variant="link" onClick={() => selectAllOfStatus(q, "in-finishing")} className="gap-1 p-0 text-xs text-[#69635E]">
                        <CheckSquare size={13} color={C.muted} /> Select all in finishing ({inFinishingSarees.length})
                      </Button>
                    )}
                  </div>
                )}

                {/* Sarees */}
                <div>
                  {q.sarees.map((s, i) => {
                    const isSelectable = s.finishingStatus === "pending" || s.finishingStatus === "in-finishing";
                    const isChecked = selected.has(s.sareeId);
                    return (
                      <div key={s.sareeId}
                        onClick={() => isSelectable && toggleSaree(q, s.sareeId)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => isSelectable && toggleSaree(q, s.sareeId))?.(); } }}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 14px", borderBottom: i < q.sarees.length - 1 ? `1px solid rgba(107,26,42,0.06)` : "none", cursor: isSelectable ? "pointer" : "default", background: isChecked ? "rgba(107,26,42,0.04)" : "transparent" }}
                      >
                        {isSelectable ? (
                          isChecked ? <CheckSquare size={15} color={C.burg} style={{ flexShrink: 0 }} /> : <Square size={15} color={C.muted} style={{ flexShrink: 0 }} />
                        ) : (
                          <Package size={14} color={C.muted} style={{ flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1 }}>
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

                {/* Actions */}
                {selected.size > 0 && (canAssign || canReceive) && (
                  <div style={{ padding: "12px 14px", borderTop: `1px solid rgba(107,26,42,0.08)`, display: "flex", gap: 8 }}>
                    {canAssign && (
                      <Button variant="primary" fullWidth iconLeft={Users} onClick={() => setPickerFor(q.id)} className="h-[42px] rounded-xl bg-[#6B1A2A] hover:bg-[#6B1A2A]">
                        Assign {selected.size} Saree{selected.size > 1 ? "s" : ""} for Finishing
                      </Button>
                    )}
                    {canReceive && (
                      <Button variant="primary" fullWidth iconLeft={ArrowDownToLine} onClick={() => handleReceive(q)}
                        className="h-[42px] rounded-xl bg-gradient-to-br from-[#1E5A3A] to-[#1E6640] text-sm font-bold hover:from-[#1E5A3A] hover:to-[#1E6640]">
                        Receive {selected.size} Saree{selected.size > 1 ? "s" : ""} from Finishing
                      </Button>
                    )}
                    <IconButton icon={X} label="Clear selection" variant="secondary" onClick={() => clearSelection(q.id)}
                      className="w-[42px] h-[42px] flex-shrink-0 rounded-xl border-[rgba(139,26,46,0.30)] text-[#6B1A2A]" />
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
    </div>
  );
}
