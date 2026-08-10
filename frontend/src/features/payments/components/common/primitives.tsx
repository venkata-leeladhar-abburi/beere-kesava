import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, Clock } from "lucide-react";

import { F, T } from "../../theme";
import { Button, Select, SelectItem } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import type { WeaverPayStatus } from "../../types";

// helper: initials avatar
export function Pip({ initials, bg, size = 36 }: { initials: string; bg: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "2px solid rgba(255,255,255,0.55)" }}>
      <span style={{ fontFamily: F.ui, fontSize: size * 0.33, fontWeight: 700, color: "#FFFDF9", letterSpacing: "-0.3px" }}>{initials}</span>
    </div>
  );
}

// helper: status badge
export function StatusBadge({ status }: { status: WeaverPayStatus }) {
  const paid = status === "Paid";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: paid ? "rgba(30,102,64,0.10)" : "rgba(196,146,58,0.12)", color: paid ? T.green : "#8B6018" }}>
      {paid ? <CheckCircle2 size={11} /> : <Clock size={11} />}{status}
    </span>
  );
}

// helper: ActionModal
export function ActionModal({ open, onClose, title, desc, actionLabel, icon: Icon = CheckCircle2, hideAction = false }: any) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleAction = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
    }, 1200);
  };

  return (
    <Modal open={open} onOpenChange={o => { if (!o) { setDone(false); onClose(); } }} size="sm">
      {done ? (
        <div style={{ padding: 48, textAlign: "center" }}>
          <Dialog.Title className="sr-only">Success</Dialog.Title>
          <CheckCircle2 size={48} color={T.green} style={{ margin: "0 auto 16px" }} />
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Success</div>
          <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.6, marginBottom: 24 }}>
            Action completed successfully.
          </div>
          <Button variant="primary" size="md" onClick={() => { setDone(false); onClose(); }}>
            Close
          </Button>
        </div>
      ) : (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Body>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={22} color={T.royalBurgundy} />
              </div>
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.6, paddingBottom: 16 }}>
              {desc}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            {!hideAction && (
              <Button variant="primary" size="sm" loading={loading} onClick={handleAction}>
                {actionLabel}
              </Button>
            )}
          </Modal.Footer>
        </>
      )}
    </Modal>
  );
}

// helper: dropdown button
export function DropBtn({ value, options, onChange }: { value?: string, options: string[], onChange?: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
    </Select>
  );
}
