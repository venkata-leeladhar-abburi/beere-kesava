import React from "react";
import { motion } from "motion/react";
import { X, Edit2 } from "lucide-react";
import { FinishingStaffMember } from "../../finishing/contexts/FinishingStaffContext";
import { T, F, EASE } from "./theme";
import { StatusBadge } from "./UserBadges";

export function ViewProfileModal({ member, onClose, onEdit }: {
  member: FinishingStaffMember;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(61,14,26,0.45)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: EASE }}
        style={{ position: "relative", width: 480, background: "#fff", borderRadius: 20, boxShadow: "0 24px 80px rgba(61,14,26,0.22)", overflow: "hidden" }}
      >
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
              <div style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(200,155,71,0.80)", marginTop: 3 }}>
                {member.empId} · Finishing Staff
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.10)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={15} color="#fff" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 28px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
            {[
              { label: "Mobile Number",   value: member.mobile || "—",          mono: true  },
              { label: "Email",           value: member.email  || "—",          mono: false },
              { label: "Employee ID",     value: member.empId  || "—",          mono: true  },
              { label: "Date Added",      value: member.dateAdded,              mono: true  },
              { label: "Specialisation",  value: member.specialisation || "—",  mono: false },
              { label: "Status",          value: member.status,                 mono: false, badge: true },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>{f.label}</div>
                {f.badge ? (
                  <StatusBadge status={f.value} />
                ) : (
                  <div style={{ fontFamily: f.mono ? F.mono : F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 500 }}>{f.value}</div>
                )}
              </div>
            ))}
          </div>

          {member.notes && (
            <div style={{ marginTop: 16, background: T.silkCream, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 5 }}>Notes</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, lineHeight: 1.55 }}>{member.notes}</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <button
              onClick={onEdit}
              style={{ flex: 1, height: 44, background: `linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
            >
              <Edit2 size={14} /> Edit Profile
            </button>
            <button
              onClick={onClose}
              style={{ flex: 1, height: 44, background: "transparent", border: `1px solid ${T.borderMed}`, borderRadius: 999, fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: T.royalBurgundy, cursor: "pointer" }}
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
