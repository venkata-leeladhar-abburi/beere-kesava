import React, { useState } from "react";
import { motion } from "motion/react";
import { X, CheckCircle2 } from "lucide-react";
import { C, F, btnPrimary } from "../tokens";
import { useFinishingStaff } from "../../../../finishing/contexts/FinishingStaffContext";
import { EASE } from "./shared";

// ── Staff picker modal ────────────────────────────────────────────────────────

export function StaffPickerModal({ onSelect, onClose }: {
  onSelect: (staff: { id: string; name: string }) => void;
  onClose: () => void;
}) {
  const { activeMembers } = useFinishingStaff();
  const [selected, setSelected] = useState<string | null>(null);

  const pick = activeMembers.find(m => m.id === selected);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.28, ease: EASE }}
        style={{ position: "relative", width: "100%", maxWidth: 420, margin: "0 auto", background: "#FFF", borderRadius: "20px 20px 0 0", padding: "20px 16px 32px", boxShadow: "0 -8px 40px rgba(0,0,0,0.18)", maxHeight: "70vh", display: "flex", flexDirection: "column" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontFamily: F.d, fontSize: 17, fontWeight: 700, color: C.text }}>Select Finishing Staff</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={20} color={C.muted} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {activeMembers.length === 0 && (
            <div style={{ padding: "24px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>
              No active finishing staff members found.
            </div>
          )}
          {activeMembers.map(m => {
            const sel = selected === m.id;
            return (
              <button key={m.id} onClick={() => setSelected(m.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: `1.5px solid ${sel ? C.burg : "rgba(107,26,42,0.12)"}`, borderRadius: 12, background: sel ? "rgba(107,26,42,0.04)" : "#FFF", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(107,26,42,0.12)", border: `1.5px solid ${sel ? C.burg : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 14, color: C.burg }}>{m.firstName[0]}{m.lastName[0]}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.text }}>{m.firstName} {m.lastName}</div>
                  <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, marginTop: 2 }}>{m.empId}{m.specialisation ? ` · ${m.specialisation}` : ""}</div>
                </div>
                {sel && <CheckCircle2 size={18} color={C.burg} />}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            disabled={!pick}
            onClick={() => { if (pick) onSelect({ id: pick.id, name: `${pick.firstName} ${pick.lastName}` }); }}
            style={{ ...btnPrimary, opacity: pick ? 1 : 0.45, cursor: pick ? "pointer" : "not-allowed" }}
          >
            Assign to {pick ? `${pick.firstName} ${pick.lastName}` : "Selected Staff"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
