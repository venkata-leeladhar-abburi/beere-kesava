import { useState, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { Users, Package, ArrowDownToLine, FileText, Building2 } from "lucide-react";
import { C, F, card } from "../tokens";
import { useFinishing, Quotation } from "../../../../finishing/contexts/FinishingContext";
import { WORKER_NAME, SectionHeader, Toast } from "./shared";
import { StaffPickerModal } from "./StaffPickerModal";
import { Button } from "../../../../../shared/ui/primitives";

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
  const [toast, setToast] = useState("");

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
          assignQuotationFinishing(q.id, pendingIds, staff, WORKER_NAME);
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
            const canAssign = pendingSarees.length > 0;
            const canReceive = inFinishingSarees.length > 0;

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

                {/* Sarees */}
                <div>
                  {q.sarees.map((s, i) => {
                    return (
                      <div key={s.sareeId}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 14px", borderBottom: i < q.sarees.length - 1 ? `1px solid rgba(107,26,42,0.06)` : "none" }}
                      >
                        <Package size={14} color={C.muted} style={{ flexShrink: 0 }} />
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
                {(canAssign || canReceive) && (
                  <div style={{ padding: "12px 14px", borderTop: `1px solid rgba(107,26,42,0.08)`, display: "flex", gap: 8 }}>
                    {canAssign && (
                      <Button variant="primary" fullWidth iconLeft={Users} onClick={() => setPickerFor(q.id)} className="h-[42px] rounded-xl bg-[#6B1A2A] hover:bg-[#6B1A2A]">
                        Assign {pendingSarees.length} Saree{pendingSarees.length > 1 ? "s" : ""} for Finishing
                      </Button>
                    )}
                    {canReceive && (
                      <Button variant="primary" fullWidth iconLeft={ArrowDownToLine} onClick={() => handleReceive(q)}
                        className="h-[42px] rounded-xl bg-gradient-to-br from-[#1E5A3A] to-[#1E6640] text-sm font-bold hover:from-[#1E5A3A] hover:to-[#1E6640]">
                        Receive {inFinishingSarees.length} Saree{inFinishingSarees.length > 1 ? "s" : ""} from Finishing
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
    </div>
  );
}
