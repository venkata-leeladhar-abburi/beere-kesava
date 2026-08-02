import React, { useState } from "react";
import { AnimatePresence } from "motion/react";
import { Truck, Clock, CheckCircle2, Package } from "lucide-react";
import { C, F } from "./tokens";
import { useFinishing, DispatchRecord } from "../FinishingContext";
import { useFirms } from "../FirmsContext";
// The admin Inventory page's own section and form — reused as-is so the worker
// screen stays identical to what admin sees.
import { DispatchHistorySection, ResumeDispatchModal } from "../../../features/inventory/components/InventoryPage";

export function WorkerDispatch({ isDesktop = false }: { isDesktop?: boolean }) {
  const { dispatches, updateDispatch } = useFinishing();
  const { firms } = useFirms();
  const [resume, setResume] = useState<DispatchRecord | null>(null);
  const [toast, setToast] = useState("");

  const pending = dispatches.filter(d => d.pendingTransport || d.pendingReceipt);
  const complete = dispatches.length - pending.length;

  const pad = isDesktop ? "24px 32px 48px" : "16px 14px 40px";

  return (
    <div style={{ background: C.bg ?? "#FAF7F2", minHeight: "100%", padding: pad }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(107,26,42,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Truck size={20} color={C.burg} />
        </div>
        <div>
          <div style={{ fontFamily: F.d, fontSize: isDesktop ? 24 : 19, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>Dispatch Details</div>
          <div style={{ fontFamily: F.u, fontSize: isDesktop ? 13 : 12, color: C.muted, marginTop: 2 }}>
            Fill in LR, transport and receipt details for dispatches raised by admin
          </div>
        </div>
      </div>

      {/* Counters */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, margin: "16px 0 18px" }}>
        {[
          { label: "Awaiting Details", value: pending.length, color: "#8B6018", bg: "rgba(200,155,71,0.14)", Icon: Clock },
          { label: "Completed", value: complete, color: C.green, bg: "rgba(30,102,64,0.10)", Icon: CheckCircle2 },
          { label: "Total Dispatches", value: dispatches.length, color: C.burg, bg: "rgba(107,26,42,0.07)", Icon: Package },
        ].map(s => (
          <div key={s.label} style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 14, padding: isDesktop ? "16px 18px" : "12px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <s.Icon size={14} color={s.color} />
              </div>
            </div>
            <div style={{ fontFamily: F.d, fontSize: isDesktop ? 26 : 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: F.u, fontSize: isDesktop ? 11.5 : 10.5, color: C.muted, marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div style={{ background: "rgba(200,155,71,0.10)", border: "1px solid rgba(200,155,71,0.32)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Clock size={16} color="#8B6018" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontFamily: F.u, fontSize: 12.5, color: C.text, lineHeight: 1.55 }}>
            <strong>{pending.length} dispatch{pending.length > 1 ? "es" : ""}</strong> still need LR and transport details. Tap <strong>Complete Details</strong> on the row to fill them in.
          </div>
        </div>
      )}

      {/* The admin Dispatch History section, unchanged. Horizontal scroll keeps
          its fixed column grid intact on narrow screens. */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 900 }}>
          <DispatchHistorySection dispatches={dispatches} firms={firms} onResume={setResume} />
        </div>
      </div>

      <AnimatePresence>
        {resume && (
          <ResumeDispatchModal
            record={resume}
            onSave={patch => {
              updateDispatch(resume.id, patch);
              setResume(null);
              setToast("Dispatch details saved");
              setTimeout(() => setToast(""), 2600);
            }}
            onClose={() => setResume(null)}
          />
        )}
      </AnimatePresence>

      {toast && (
        <div style={{ position: "fixed", bottom: 84, left: "50%", transform: "translateX(-50%)", zIndex: 600, background: C.green, color: "#FFF", borderRadius: 999, padding: "11px 22px", fontFamily: F.u, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 28px rgba(30,102,64,0.32)", display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={15} /> {toast}
        </div>
      )}
    </div>
  );
}
