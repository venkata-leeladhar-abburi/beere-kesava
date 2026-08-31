import * as Dialog from "@radix-ui/react-dialog";
import { X, Edit2 } from "lucide-react";
import { TableRow } from "./utils";
import { T, F } from "./theme";
import { RoleBadge, StatusBadge } from "./UserBadges";
import { Button, IconButton } from "../../../shared/ui/primitives";
import { Modal } from "../../../shared/ui/overlay";

export function ViewUserModal({ row, onClose, onEdit }: {
  row: TableRow;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <Modal open onOpenChange={o => { if (!o) onClose(); }} size="sm">
      <Dialog.Title className="sr-only">{row.firstName} {row.lastName} — profile</Dialog.Title>
      <Dialog.Description className="sr-only">User profile details</Dialog.Description>
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderTopLeftRadius: "var(--radius-xl)", borderTopRightRadius: "var(--radius-xl)" }}>
        <div style={{ background: T.darkBurgundy, padding: "22px 28px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: `rgba(44,74,139,0.35)`, border: "2px solid rgba(200,155,71,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.antiqueGold }}>
                {row.firstName[0]}{row.lastName[0]}
              </span>
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#fff", lineHeight: 1.2 }}>
                {row.firstName} {row.lastName}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(200,155,71,0.80)", marginTop: 3 }}>
                {row.empId} · {row.role}
              </div>
            </div>
          </div>
          <Dialog.Close asChild>
            <IconButton label="Close" icon={X} size="sm" variant="ghost" onClick={onClose}
              className="bg-white/10 text-white hover:bg-white/20 hover:text-white" />
          </Dialog.Close>
        </div>

        <div style={{ padding: "22px 28px 28px" }}>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "16px 20px" }}>
            {[
              { label: "Mobile Number", value: row.mobile || "—", mono: false },
              { label: "Email", value: row.email || "—", mono: false },
              { label: "Employee ID", value: row.empId || "—", mono: true },
              { label: "Portal", value: row.portal || "—", mono: false },
              { label: "Date Added", value: row.dateAdded, mono: false },
              { label: "Role", value: row.role, mono: false, role: true },
              { label: "Status", value: row.status, mono: false, badge: true },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>{f.label}</div>
                {f.badge ? (
                  <StatusBadge status={f.value} />
                ) : f.role ? (
                  <RoleBadge role={f.value} />
                ) : (
                  // eslint-disable-next-line no-restricted-syntax -- empId is a plain staff code, not a chart series
                  <div style={{ fontFamily: f.mono ? "var(--font-mono)" : F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 500 }}>{f.value}</div>
                )}
              </div>
            ))}
          </div>

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
