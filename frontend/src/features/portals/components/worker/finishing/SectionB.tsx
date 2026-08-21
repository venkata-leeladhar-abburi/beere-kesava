import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckSquare, Square, CheckCircle2, ArrowDownToLine, Clock, X } from "lucide-react";
import { C, F, card } from "../tokens";
import { useFinishing } from "@/features/finishing";
import { EASE, WORKER_NAME, SectionHeader, ScanBar, useScan, Toast } from "./shared";
import { VerificationModal, VerifData } from "./VerificationModal";
import { Button, IconButton } from "../../../../../shared/ui/primitives";

// ── Section B — Receive returns ───────────────────────────────────────────────
// NOTE: not currently wired up in the composition root (superseded by
// SectionBFiltered) — kept as-is to preserve behavior during extraction.

export function SectionB({ isMobile }: { isMobile?: boolean }) {
  const { assignments, receiveReturn } = useFinishing();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showVerif, setShowVerif] = useState(false);
  const [toast, setToast] = useState("");

  const awaiting = useMemo(() => assignments.filter(a => a.status === "awaiting-return"), [assignments]);
  const unselectedIds = awaiting.filter(a => !selected.has(a.id)).map(a => a.sareeId);
  // Scan by saree ID → find the assignment
  const { scanMsg, scanValue, setScanValue, submitScan } = useScan(unselectedIds, sareeId => {
    const match = awaiting.find(a => a.sareeId === sareeId);
    if (match) setSelected(prev => { const next = new Set(prev); next.add(match.id); return next; });
  });

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === awaiting.length) setSelected(new Set());
    else setSelected(new Set(awaiting.map(a => a.id)));
  };

  const selectedAssignments = awaiting.filter(a => selected.has(a.id));

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const handleSave = (data: Record<string, VerifData>) => {
    Object.entries(data).forEach(([assignmentId, d]) => {
      if (!d.condition) return;
      const assignment = awaiting.find(a => a.id === assignmentId);
      if (!assignment) return;
      receiveReturn({
        assignmentId,
        sareeId: assignment.sareeId,
        condition: d.condition,
        damageType: d.damageType || undefined,
        damageSeverity: d.damageSeverity || undefined,
        damageNotes: d.damageNotes || undefined,
        damagePhotoUrl: d.damagePhotoUrl,
        receivedBy: WORKER_NAME,
        receivedDate: today,
      });
    });
    const perfect  = Object.values(data).filter(d => d.condition === "perfect").length;
    const damaged  = Object.values(data).filter(d => d.condition === "damaged").length;
    setToast(`${perfect} perfect, ${damaged} damaged — logged`);
    setSelected(new Set());
    setShowVerif(false);
  };

  const allChecked = awaiting.length > 0 && selected.size === awaiting.length;

  return (
    <div style={{ ...card, padding: 16 }}>
      <SectionHeader
        icon={<ArrowDownToLine size={18} color="#1E6640" />}
        title="Receive Sarees Back"
        count={awaiting.length}
        accent="rgba(30,102,64,0.10)"
      />

      {/* Sub-header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
        <ScanBar value={scanValue} onChange={setScanValue} onSubmit={submitScan} />
        {awaiting.length > 0 && (
          <Button variant="link" onClick={toggleAll} className="gap-1.5 p-0 px-1.5 py-1 text-xs text-[#69635E]">
            {allChecked ? <CheckSquare size={15} color={C.burg} /> : <Square size={15} color={C.muted} />}
            {allChecked ? "Deselect All" : "Select All"}
          </Button>
        )}
      </div>

      {/* Scan feedback */}
      {scanMsg && (
        <div style={{ background: "rgba(30,102,64,0.06)", border: `1px solid rgba(30,102,64,0.18)`, borderRadius: 8, padding: "7px 11px", marginBottom: 10, fontFamily: F.m, fontSize: 12, color: "#1E6640" }}>
          {scanMsg}
        </div>
      )}

      {awaiting.length === 0 ? (
        <div style={{ padding: "28px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>
          No sarees currently awaiting return.
        </div>
      ) : (
        <div style={{ border: `1px solid rgba(110,15,45,0.10)`, borderRadius: 10, overflow: "hidden" }}>
          {awaiting.map((a, i) => {
            const checked = selected.has(a.id);
            return (
              <div key={a.id}
                onClick={() => toggleRow(a.id)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => toggleRow(a.id))?.(); } }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderTop: i > 0 ? `1px solid rgba(110,15,45,0.07)` : "none", background: checked ? "rgba(30,102,64,0.04)" : "#FFF", cursor: "pointer", transition: "background 0.12s" }}
              >
                <div style={{ flexShrink: 0 }}>
                  {checked ? <CheckSquare size={16} color="#1E6640" /> : <Square size={16} color={C.muted} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.burg }}>{a.sareeId}</div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 1 }}>{a.designCode} · {a.sareeType}</div>
                  <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text, marginTop: 2 }}>{a.finishingStaffName}</div>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" as const }}>
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginBottom: 4 }}>{a.assignedDate}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(248,140,0,0.10)", border: "1px solid rgba(248,140,0,0.22)", borderRadius: 999, padding: "2px 7px" }}>
                    <Clock size={9} color="#B85C00" />
                    <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#B85C00" }}>Awaiting</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action bar — inline on tablet/desktop, bottom action sheet on mobile */}
      <AnimatePresence>
        {selected.size > 0 && (isMobile ? (
          <motion.div key="sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.26, ease: EASE }}
            style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 250, background: "#FFF", borderRadius: "16px 16px 0 0", padding: "14px 16px calc(16px + env(safe-area-inset-bottom))", boxShadow: "0 -8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 10, textAlign: "center" as const }}>
              {selected.size} saree{selected.size > 1 ? "s" : ""} selected
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              <Button variant="primary" fullWidth iconLeft={CheckCircle2} onClick={() => setShowVerif(true)}
                className="h-[50px] rounded-full bg-[#1E6640] hover:bg-[#1E6640] text-sm">
                Mark as Received
              </Button>
              <Button variant="secondary" fullWidth onClick={() => setSelected(new Set())}
                className="h-[46px] rounded-full border-[rgba(110,15,45,0.30)] text-[#6E0F2D] text-[13px]">
                Cancel
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="bar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2, ease: EASE }}
            style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <Button variant="primary" fullWidth iconLeft={CheckCircle2} onClick={() => setShowVerif(true)}
              className="h-[46px] rounded-full bg-[#1E6640] hover:bg-[#1E6640] text-sm">
              Mark {selected.size} as Received
            </Button>
            <IconButton icon={X} label="Cancel selection" variant="secondary" onClick={() => setSelected(new Set())}
              className="w-[46px] h-[46px] flex-shrink-0 rounded-xl border-[rgba(110,15,45,0.30)] text-[#6E0F2D]" />
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {showVerif && (
          <VerificationModal
            assignments={selectedAssignments}
            onSave={handleSave}
            onClose={() => setShowVerif(false)}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <Toast msg={toast} onDone={() => setToast("")} />}
      </AnimatePresence>
    </div>
  );
}
