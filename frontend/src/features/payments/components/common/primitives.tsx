import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, X, type LucideIcon } from "lucide-react";

import { F, T } from "../../theme";
import { Button, IconButton, Select, SelectItem } from "../../../../shared/ui/primitives";
import { cn } from "../../../../shared/ui/utils";
import { Modal } from "../../../../shared/ui/overlay";
import { StatusPill } from "@/shared/ui/domain";
import type { PaymentStatus } from "@/lib/domain/status";
import { toInitials } from "@/shared/lib/initials";

// helper: initials avatar
export function Pip({ initials, bg, size = 36 }: { initials: string; bg: string; size?: number }) {
  const displayInitials = toInitials(initials, "");
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "2px solid rgba(255,255,255,0.55)" }}>
      <span style={{ fontFamily: F.ui, fontSize: size * 0.33, fontWeight: 700, color: "#FFFDF9", letterSpacing: "-0.3px" }}>{displayInitials}</span>
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
export function ActionModal({ open, onClose, title, desc, actionLabel, icon: Icon = CheckCircle2, hideAction = false }: {
  open: boolean;
  onClose: () => void;
  title: string;
  desc: React.ReactNode;
  actionLabel?: React.ReactNode;
  icon?: LucideIcon;
  hideAction?: boolean;
}) {
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
          <Dialog.Description className="sr-only">Action completed successfully</Dialog.Description>
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
          <div style={{
            background: `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTopLeftRadius: "var(--radius-lg)",
            borderTopRightRadius: "var(--radius-lg)",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={22} color="#FFFDF9" />
              </div>
              <Dialog.Title style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFFDF9", margin: 0 }}>
                {title}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <IconButton
                icon={X}
                label="Close"
                onClick={onClose}
                shape="circle"
                className="bg-white/12 text-white border border-white/22 hover:bg-white/18"
              />
            </Dialog.Close>
          </div>
          <Modal.Body className="pt-5">
            <Dialog.Description style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.6, paddingBottom: 8 }}>
              {desc}
            </Dialog.Description>
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
      <div className="p-4 sm:p-7" style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)` }}>
        <div className="flex items-start gap-3.5 sm:gap-4 w-full">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
            <Icon size={24} color="#FFFDF9" />
          </div>
          <div className="flex flex-col items-start gap-3 flex-1 min-w-0">
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px", lineHeight: 1.2 }}>{title}</div>
              {subtitle && <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.70)", marginTop: 4, lineHeight: 1.5 }}>{subtitle}</div>}
            </div>
            {actions && <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto pt-1">{actions}</div>}
          </div>
        </div>
      </div>
      <div className="p-2.5 sm:p-5 md:p-6 pb-2.5 sm:pb-4">
        {children}
      </div>
    </div>
  );
}

// helper: dropdown button
export function DropBtn({ value, options, onChange, className }: { value?: string; options: string[]; onChange?: (v: string) => void; className?: string }) {
  return (
    <Select value={value} onValueChange={onChange} size="sm" containerClassName="w-auto shrink-0" className={cn("w-auto min-w-[130px] font-semibold text-[13px]", className)}>
      {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
    </Select>
  );
}
