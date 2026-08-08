import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { DispatchRecord } from "../../design-library/contexts/DesignLibraryContext";
import { IconButton } from "../../../shared/ui/primitives";
import { Modal, type ModalSize } from "../../../shared/ui/overlay";

// Extracted out of BatchCreationPage.tsx so FactoryLoomPage.tsx (which also needs
// this modal) doesn't have to import from BatchCreationPage.tsx, which in turn
// imports from FactoryLoomPage.tsx — that mutual import was a circular dependency.
const T = {
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  luxuryBrown:   "#3B2314",
  taupe:         "#69635E",
  borderDef:     "rgba(110,15,45,0.10)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

function sizeForWidth(width: number): ModalSize {
  if (width <= 420) return "xs";
  if (width <= 560) return "sm";
  if (width <= 720) return "md";
  return "lg";
}

function PickerShell({ title, onClose, children, width = 480 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <Modal open onOpenChange={o => !o && onClose()} size={sizeForWidth(width)}>
      <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <Dialog.Title asChild>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{title}</div>
        </Dialog.Title>
        <Dialog.Close asChild>
          <IconButton icon={X} label="Close" variant="ghost" size="sm" />
        </Dialog.Close>
      </div>
      <div style={{ paddingTop: 16, overflowY: "auto" }}>{children}</div>
    </Modal>
  );
}

export function DispatchDetailsModal({ weaverName, records, onClose }: { weaverName: string; records: DispatchRecord[]; onClose: () => void }) {
  return (
    <PickerShell title={`Design Dispatch — ${weaverName}`} onClose={onClose} width={460}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {records.map(d => (
          <div key={d.id} style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{d.id}</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{d.sentAt}</span>
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 4 }}>Instructions</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, lineHeight: 1.55, marginBottom: d.colorSlipImage ? 12 : 0 }}>{d.instructions}</div>
            {d.colorSlipImage && (
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 6 }}>Color Slip</div>
                <img src={d.colorSlipImage} alt="Color slip" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: `1px solid ${T.borderDef}` }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </PickerShell>
  );
}
