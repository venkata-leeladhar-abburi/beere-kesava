import React, { useState } from "react";
import { AnimatePresence } from "motion/react";
import { Truck, Clock, CheckCircle2, Package } from "lucide-react";
import { C, F } from "./tokens";
import { PageHero, StatsStrip, SectionHeading, type WorkerStat } from "./primitives";
import { useFinishing, DispatchRecord } from "@/features/finishing";
import { AwaitingDispatchTable } from "./AwaitingDispatchTable";
import { useFirms } from "@/features/firms";
// The admin Inventory page's own section and form — reused as-is so the worker
// screen stays identical to what admin sees.
import { DispatchHistorySection, ResumeDispatchModal, DispatchInvoiceModal, DispatchChallanModal } from "@/features/inventory";

// `isDesktop` is still passed by WorkerPortalDesktop but this view renders the
// same either way, so the prop is accepted and deliberately unread.
export function WorkerDispatch(_props: { isDesktop?: boolean }) {
  const { dispatches, updateDispatch, returns, deleteDispatch, isLoading, isError, refetch } = useFinishing();
  const { firms } = useFirms();
  const [resume, setResume] = useState<DispatchRecord | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DispatchRecord | null>(null);
  const [toast, setToast] = useState("");

  const pending = dispatches.filter(d => d.pendingTransport || d.pendingReceipt);
  const complete = dispatches.length - pending.length;

  const dispatchedSarees = React.useMemo(() => new Set(dispatches.flatMap(d => d.sareeIds)), [dispatches]);
  const awaitingDispatch = React.useMemo(() => {
    return returns.filter(r => r.inventoryStatus === "Ready for Dispatch" && !dispatchedSarees.has(r.sareeId));
  }, [returns, dispatchedSarees]);

  const stats: WorkerStat[] = [
    { label: "Awaiting dispatch", value: awaitingDispatch.length, sub: "Finished, ready to send", icon: Package },
    { label: "Awaiting details", value: pending.length, sub: pending.length > 0 ? "⚠ Need LR / transport" : "All details filled", icon: Clock, alert: pending.length > 0 },
    { label: "Completed", value: complete, sub: "Fully documented", icon: CheckCircle2, highlight: complete > 0 },
    { label: "Total dispatches", value: dispatches.length, sub: "Across shops and wholesale", icon: Truck },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      {/* Full-width PageHero & Overlapping StatsStrip matching all other portal pages */}
      <PageHero
        eyebrow="Worker Staff · Outbound"
        title="Dispatch"
        titleAccent="Details"
        description="Fill in LR, transport and receipt details for dispatches raised by admin, and track every consignment on its way out."
      />
      <StatsStrip stats={stats} overlap={true} />

      <div className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 32, paddingBottom: 64 }}>

      {pending.length > 0 && (
        <div style={{ background: "rgba(200,155,71,0.10)", border: "1px solid rgba(200,155,71,0.32)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Clock size={16} color="#8B6018" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.text, lineHeight: 1.55 }}>
            <strong>{pending.length} dispatch{pending.length > 1 ? "es" : ""}</strong> still need LR and transport details. Tap <strong>Complete Details</strong> on the row to fill them in.
          </div>
        </div>
      )}

      {/* Sarees Awaiting Dispatch */}
      <div style={{ marginBottom: 24 }}>
        <SectionHeading title={`Sarees Awaiting Dispatch (${awaitingDispatch.length})`} size="sm" />
        <AwaitingDispatchTable
          sarees={awaitingDispatch}
          loading={isLoading}
          error={isError}
          onRetry={refetch}
        />
      </div>

      {/* Dispatch History Section */}
      <DispatchHistorySection 
        dispatches={dispatches} 
        firms={firms} 
        onResume={setResume} 
        onDelete={(d) => deleteDispatch(d.id, "worker-staff")}
        // Was an alert("coming soon") dead end — worker staff now open the same
        // document admin does: a challan for shop runs, an invoice for wholesale.
        onViewInvoice={setViewingDoc}
      />

      </div>

      <AnimatePresence>
        {viewingDoc && viewingDoc.type === "shop" && (
          <DispatchChallanModal dispatch={viewingDoc} onClose={() => setViewingDoc(null)} />
        )}
        {viewingDoc && viewingDoc.type !== "shop" && (
          <DispatchInvoiceModal dispatch={viewingDoc} onClose={() => setViewingDoc(null)} />
        )}
      </AnimatePresence>

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
