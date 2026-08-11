import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, type LucideIcon } from "lucide-react";

import { F, T } from "../../theme";
import { Button, Select, SelectItem } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { StatusPill } from "@/shared/ui/domain";
import type { PaymentStatus } from "@/lib/domain/status";

// helper: initials avatar
export function Pip({ initials, bg, size = 36 }: { initials: string; bg: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "2px solid rgba(255,255,255,0.55)" }}>
      <span style={{ fontFamily: F.ui, fontSize: size * 0.33, fontWeight: 700, color: "#FFFDF9", letterSpacing: "-0.3px" }}>{initials}</span>
    </div>
  );
}

// helper: status badge — a genuine PAYMENT_STATUS lifecycle value
// (design-system/06-DOMAIN.md Part D), rendered through the shared taxonomy.
// The prop stays "Paid" | "Pending" rather than the taxonomy's own key type:
// WeaverRecord.status (payments/types.ts) is threaded through several
// out-of-scope call sites (WeaverCard.tsx, WeaverPaymentDetailModal.tsx,
// WeaverMakingChargesSection.tsx) doing exact `=== "Paid"` comparisons and
// dropdown-filter matches — retyping the field would ripple into those files.
// This translates to the canonical key only at the render boundary.
export function StatusBadge({ status }: { status: "Paid" | "Pending" }) {
  const key: PaymentStatus = status === "Paid" ? "paid" : "unpaid";
  return <StatusPill taxonomy="payment" status={key} />;
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

// helper: section banner card — dark maroon gradient header (icon + title +
// subtitle + actions) atop a white padded body, matching the pattern used
// across the Production and Materials pages.
export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  actions,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>
      <div style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={26} color="#FFFDF9" />
          </div>
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px" }}>{title}</div>
            {subtitle && <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>{subtitle}</div>}
          </div>
        </div>
        {actions && <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>{actions}</div>}
      </div>
      <div style={{ padding: "24px 28px 28px" }}>
        {children}
      </div>
    </div>
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
