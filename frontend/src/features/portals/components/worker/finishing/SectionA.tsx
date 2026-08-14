import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckSquare, Square, Users, X } from "lucide-react";
import { C, F } from "../tokens";
import { useFinishing } from "@/features/finishing";
import { EASE, WORKER_NAME, ScanBarBtn, useScanSim, Toast } from "./shared";
import { StaffPickerModal } from "./StaffPickerModal";
import { Button, IconButton } from "../../../../../shared/ui/primitives";

// ── Section A — Assign sarees ─────────────────────────────────────────────────

export function SectionA({ isMobile }: { isMobile?: boolean }) {
  const { readySarees, assignSarees } = useFinishing();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showPicker, setShowPicker] = useState(false);
  const [toast, setToast] = useState("");

  const unselectedIds = readySarees.filter(s => !selected.has(s.id)).map(s => s.id);
  const { scanning, scanMsg, startScan } = useScanSim(unselectedIds, id => {
    setSelected(prev => { const next = new Set(prev); next.add(id); return next; });
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
    if (selected.size === readySarees.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(readySarees.map(s => s.id)));
    }
  };

  const handleAssign = (staff: { id: string; name: string }) => {
    assignSarees([...selected], staff, WORKER_NAME);
    setToast(`${selected.size} saree${selected.size > 1 ? "s" : ""} assigned to ${staff.name}`);
    setSelected(new Set());
    setShowPicker(false);
  };

  const allChecked = readySarees.length > 0 && selected.size === readySarees.length;

  return (
    <div>
      {/* Sub-header: scan + select-all */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
        <ScanBarBtn label={scanning ? "Scanning…" : "Scan Barcode"} onClick={startScan} />
        {readySarees.length > 0 && (
          <Button variant="link" onClick={toggleAll} className="gap-1.5 p-0 px-1.5 py-1 text-xs text-[#69635E]">
            {allChecked ? <CheckSquare size={15} color={C.burg} /> : <Square size={15} color={C.muted} />}
            {allChecked ? "Deselect All" : "Select All"}
          </Button>
        )}
      </div>

      {/* Scan feedback */}
      {scanMsg && (
        <div style={{ background: "rgba(110,15,45,0.05)", border: `1px solid rgba(110,15,45,0.12)`, borderRadius: 10, padding: "9px 13px", marginBottom: 12, fontFamily: F.m, fontSize: 12, color: C.burg }}>
          {scanMsg}
        </div>
      )}

      {/* Table */}
      {readySarees.length === 0 ? (
        <div style={{ padding: "28px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>
          No QC-passed sarees awaiting finishing.
        </div>
      ) : (
        <div style={{ border: `1px solid rgba(110,15,45,0.10)`, borderRadius: 14, overflow: "hidden" }}>
          {readySarees.map((s, i) => {
            const checked = selected.has(s.id);
            return (
              <div key={s.id}
                onClick={() => toggleRow(s.id)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => toggleRow(s.id))?.(); } }}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", minHeight: 64, borderTop: i > 0 ? `1px solid rgba(110,15,45,0.07)` : "none", borderLeft: `3px solid ${checked ? C.burg : "transparent"}`, background: checked ? "rgba(110,15,45,0.05)" : "#FFF", cursor: "pointer", transition: "background 0.12s" }}
              >
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                  {checked ? <CheckSquare size={20} color={C.burg} /> : <Square size={20} color={C.muted} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 500, color: C.burg }}>{s.id}</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.designCode} · {s.sareeType}
                  </div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>{s.weaverName}</div>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" as const }}>
                  <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>QC passed</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>{s.qcPassDate}</div>
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
              <Button variant="primary" fullWidth iconLeft={Users} onClick={() => setShowPicker(true)}
                className="h-[50px] rounded-full bg-[#6E0F2D] hover:bg-[#6E0F2D] text-sm">
                Assign Staff
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
            <Button variant="primary" fullWidth iconLeft={Users} onClick={() => setShowPicker(true)}
              className="h-[46px] rounded-full bg-[#6E0F2D] hover:bg-[#6E0F2D] text-sm">
              Assign {selected.size} Saree{selected.size > 1 ? "s" : ""} to Finishing Staff
            </Button>
            <IconButton icon={X} label="Cancel selection" variant="secondary" onClick={() => setSelected(new Set())}
              className="w-[46px] h-[46px] flex-shrink-0 rounded-xl border-[rgba(110,15,45,0.30)] text-[#6E0F2D]" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showPicker && <StaffPickerModal onSelect={handleAssign} onClose={() => setShowPicker(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <Toast msg={toast} onDone={() => setToast("")} />}
      </AnimatePresence>
    </div>
  );
}
