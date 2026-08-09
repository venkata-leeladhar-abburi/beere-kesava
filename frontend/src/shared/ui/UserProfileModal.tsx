import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { BACKEND_TO_FRONTEND_ROLE, BackendRole } from "../api/users";
import { IconButton, Button } from "./primitives";
import { Modal } from "./overlay";

const ROLE_TITLE: Record<string, string> = {
  Admin: "Store Administrator",
  "Worker Staff": "Worker Staff",
  "Finishing Staff": "Finishing Staff",
  Weaver: "Master Handloom Weaver",
  "Shop Staff": "Shop Showroom Staff",
  Accountant: "Accountant",
};

function formatJoined(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Single real profile modal, driven entirely by the authenticated user's
 * actual backend data (see AuthContext / POST /auth/verify-otp) — no
 * per-role mock name/email/phone/join-date. Fields with no real value show
 * "—" rather than a fabricated placeholder. Shared across every
 * portal/dashboard's profile button; there is only one of these now.
 */
export function UserProfileModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();

  const name = user?.name || "—";
  const initials = name === "—" ? "—" : name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const frontendRole = user?.role ? (BACKEND_TO_FRONTEND_ROLE[user.role as BackendRole] ?? user.role) : "—";
  const joined = formatJoined(user?.dateAdded);

  const rows: { label: string; value: string }[] = [
    { label: "Email Address", value: user?.email || "—" },
    { label: "Phone Number", value: user?.mobile ? `+91 ${user.mobile}` : "—" },
    ...(joined ? [{ label: "Joined Date", value: joined }] : []),
    ...(user?.accessLevel && frontendRole === "Admin" ? [{ label: "Access Level", value: user.accessLevel === "FULL_ACCESS" ? "Full Access" : "Semi Access" }] : []),
  ];

  return (
    <Modal open onOpenChange={o => !o && onClose()} size="xs">
        {/* Banner */}
        <div style={{ background: "linear-gradient(135deg, #4A061B 0%, #6B1A2A 100%)", padding: "32px 24px 28px", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" as const }}>
          <Dialog.Title className="sr-only">User Profile</Dialog.Title>
          <Dialog.Close asChild>
            <IconButton
              icon={X}
              label="Close"
              onClick={onClose}
              variant="ghost"
              shape="circle"
              className="absolute top-4 right-4 border-none bg-white/12 text-white hover:bg-white/20 hover:text-white"
            />
          </Dialog.Close>

          <div style={{ width: 85, height: 85, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 30, fontWeight: 700, color: "#FFF" }}>
              {initials}
            </span>
          </div>

          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: "#FFF", lineHeight: 1.2 }}>
            {name}
          </div>

          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
            {user?.empId || "—"}
          </div>

          <div style={{ marginTop: 8, display: "inline-block", background: "rgba(196,146,58,0.22)", border: "1px solid rgba(196,146,58,0.40)", borderRadius: 999, padding: "4px 14px" }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: "#845E04" }}>
              {ROLE_TITLE[frontendRole] ?? frontendRole}
            </span>
          </div>
        </div>

        {/* Details List */}
        <div style={{ padding: "24px 24px" }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: "#69635E", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>Contact & Account Details</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {rows.map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid rgba(139,26,46,0.06)", paddingBottom: 10 }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#69635E" }}>{item.label}</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: "#1A0A0F", textAlign: "right" as const }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, textAlign: "center" as const }}>
            <Button
              onClick={onClose}
              variant="primary"
              className="!rounded-full !bg-[#6B1A2A] !px-6 !shadow-[0_4px_14px_rgba(107,26,42,0.2)] hover:!bg-[#5A1523]"
            >
              Close Profile
            </Button>
          </div>
        </div>
    </Modal>
  );
}
