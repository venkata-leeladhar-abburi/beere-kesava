import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { C, F } from "../tokens";
import { useFinishingStaff } from "@/features/finishing";
import { Button } from "../../../../../shared/ui/primitives";
import { Modal } from "../../../../../shared/ui/overlay";

// ── Staff picker modal ────────────────────────────────────────────────────────

export function StaffPickerModal({ onSelect, onClose }: {
  onSelect: (staff: { id: string; name: string }) => void;
  onClose: () => void;
}) {
  const { activeMembers } = useFinishingStaff();
  const [selected, setSelected] = useState<string | null>(null);

  const pick = activeMembers.find(m => m.id === selected);

  return (
    <Modal open onOpenChange={o => { if (!o) onClose(); }} size="xs">
      <Modal.Header title="Select Finishing Staff" />
      <Modal.Body>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 16 }}>
          {activeMembers.length === 0 && (
            <div style={{ padding: "24px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>
              No active finishing staff members found.
            </div>
          )}
          {activeMembers.map(m => {
            const sel = selected === m.id;
            return (
              <Button key={m.id} variant="tertiary" fullWidth onClick={() => setSelected(m.id)}
                className={sel
                  ? "h-auto justify-start gap-3 rounded-xl border-[1.5px] border-[#6E0F2D] bg-[rgba(110,15,45,0.04)] px-3.5 py-3 text-left transition-all"
                  : "h-auto justify-start gap-3 rounded-xl border-[1.5px] border-[rgba(110,15,45,0.12)] bg-white px-3.5 py-3 text-left transition-all"}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(110,15,45,0.12)", border: `1.5px solid ${sel ? C.burg : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 14, color: C.burg }}>{m.firstName[0]}{m.lastName[0]}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.text }}>{m.firstName} {m.lastName}</div>
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>{m.empId}{m.specialisation ? ` · ${m.specialisation}` : ""}</div>
                </div>
                {sel && <CheckCircle2 size={18} color={C.burg} />}
              </Button>
            );
          })}
        </div>
      </Modal.Body>
      <Modal.Footer className="justify-stretch">
        <Button
          variant="primary"
          fullWidth
          disabled={!pick}
          onClick={() => { if (pick) onSelect({ id: pick.id, name: `${pick.firstName} ${pick.lastName}` }); }}
          className="rounded-full bg-[#6E0F2D] hover:bg-[#6E0F2D]"
        >
          Assign to {pick ? `${pick.firstName} ${pick.lastName}` : "Selected Staff"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
