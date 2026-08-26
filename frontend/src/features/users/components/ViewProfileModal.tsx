import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Edit2 } from "lucide-react";
import { FinishingStaffMember } from "@/features/finishing";
import { T, F } from "./theme";
import { StatusBadge } from "./UserBadges";
import { Button, IconButton } from "../../../shared/ui/primitives";
import { Modal } from "../../../shared/ui/overlay";

export function ViewProfileModal({ member, onClose, onEdit }: {
  member: FinishingStaffMember;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <Modal open onOpenChange={o => { if (!o) onClose(); }} size="sm">
      <Dialog.Title className="sr-only">{member.firstName} {member.lastName} — profile</Dialog.Title>
      <Dialog.Description className="sr-only">User profile details</Dialog.Description>
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderTopLeftRadius: "var(--radius-xl)", borderTopRightRadius: "var(--radius-xl)" }}>
        {/* Header band */}
        <div style={{ background: T.darkBurgundy, padding: "22px 28px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: `rgba(44,74,139,0.35)`, border: "2px solid rgba(200,155,71,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.antiqueGold }}>
                {member.firstName[0]}{member.lastName[0]}
              </span>
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#fff", lineHeight: 1.2 }}>
                {member.firstName} {member.lastName}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(200,155,71,0.80)", marginTop: 3 }}>
                {member.empId} · Finishing Staff
              </div>
            </div>
          </div>
          <Dialog.Close asChild>
            <IconButton label="Close" icon={X} size="sm" variant="ghost" onClick={onClose}
              className="bg-white/10 text-white hover:bg-white/20 hover:text-white" />
          </Dialog.Close>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 28px 28px" }}>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "16px 20px" }}>
            {[
              { label: "Mobile Number",   value: member.mobile || "—",          mono: false },
              { label: "Email",           value: member.email  || "—",          mono: false },
              { label: "Employee ID",     value: member.empId  || "—",          mono: true  },
              { label: "Date Added",      value: member.dateAdded,              mono: false },
              { label: "Specialisation",  value: member.specialisation || "—",  mono: false },
              { label: "Status",          value: member.status,                 mono: false, badge: true },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>{f.label}</div>
                {f.badge ? (
                  <StatusBadge status={f.value} />
                ) : (
                  // eslint-disable-next-line no-restricted-syntax -- empId is a plain staff code, not a chart series
                  <div style={{ fontFamily: f.mono ? "var(--font-mono)" : F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 500 }}>{f.value}</div>
                )}
              </div>
            ))}
          </div>

          {member.notes && (
            <div style={{ marginTop: 16, background: T.silkCream, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 5 }}>Notes</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, lineHeight: 1.55 }}>{member.notes}</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <Button variant="primary" fullWidth iconLeft={Edit2} onClick={onEdit}>
              Edit Profile
            </Button>
            <Button variant="secondary" fullWidth onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
