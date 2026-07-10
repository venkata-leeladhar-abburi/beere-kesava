import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, ChevronDown, UserPlus, CheckCircle2, Edit2, ShieldOff,
  Users, Shield, X, ChevronLeft, ChevronRight, Phone, Mail,
  Briefcase, Lock, FileText, Eye, Sparkles,
} from "lucide-react";
import { useFinishingStaff, FinishingStaffMember } from "./FinishingStaffContext";

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════
const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#8B7060",
  green:         "#1E6640",
  greenBg:       "rgba(30,102,64,0.09)",
  crimson:       "#C0392B",
  crimsonBg:     "rgba(192,57,43,0.08)",
  borderDef:     "rgba(110,15,45,0.10)",
  borderMed:     "rgba(110,15,45,0.20)",
  borderGold:    "rgba(200,155,71,0.22)",
  bgGold:        "rgba(200,155,71,0.10)",
  cream:         "#F0E8D0",
  blue:          "#2C4A8B",
};

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

const EASE: [number,number,number,number] = [0.22, 1, 0.36, 1];

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${T.borderDef}`,
  borderRadius: 16,
  boxShadow: "0 2px 12px rgba(44,24,16,0.07)",
  overflow: "hidden",
};

const inputStyle: React.CSSProperties = {
  background: "#FFF8F0",
  border: `1px solid rgba(110,15,45,0.18)`,
  borderRadius: 10,
  padding: "10px 14px",
  fontFamily: F.ui,
  fontSize: 14,
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
  color: T.luxuryBrown,
  transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  fontFamily: F.ui,
  fontSize: 11,
  fontWeight: 600,
  color: T.taupe,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  marginBottom: 6,
  display: "block",
};

// ═══════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════
const ROLE_TO_PORTAL: Record<string, string> = {
  "Admin":            "Admin Portal — Full Access",
  "Worker Staff":     "Worker Staff Portal",
  "Finishing Staff":  "Finishing Staff (No Portal)",
  "Weaver":           "Weaver Portal",
  "Shop Staff":       "Shop Staff Portal",
};

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Admin":           { bg: "rgba(110,15,45,0.09)",    text: "#6E0F2D",   border: "rgba(110,15,45,0.15)"   },
  "Worker Staff":    { bg: "rgba(30,102,64,0.09)",    text: "#1E6640",   border: "rgba(30,102,64,0.15)"   },
  "Finishing Staff": { bg: "rgba(44,74,139,0.09)",    text: "#2C4A8B",   border: "rgba(44,74,139,0.15)"   },
  "Weaver":          { bg: "rgba(200,155,71,0.14)",   text: "#7A5E1C",   border: "rgba(200,155,71,0.22)"  },
  "Shop Staff":      { bg: "rgba(59,35,20,0.08)",     text: "#3B2314",   border: "rgba(59,35,20,0.14)"    },
};

const ROLES = ["Admin", "Worker Staff", "Finishing Staff", "Weaver", "Shop Staff"];

// Static rows for non-finishing staff (finishing staff comes from context)
const STATIC_USERS = [
  { empId: "EMP-001", firstName: "Ravi",    lastName: "Kumar",    role: "Admin",        mobile: "+91 98765 43210", portal: "Admin Portal",    dateAdded: "01 Jun 2026", status: "Active"   },
  { empId: "EMP-002", firstName: "Meena",   lastName: "Krishnan", role: "Admin",        mobile: "+91 87654 32109", portal: "Admin Portal",    dateAdded: "01 Jun 2026", status: "Active"   },
  { empId: "EMP-003", firstName: "Suresh",  lastName: "Murti",    role: "Worker Staff", mobile: "+91 76543 21098", portal: "Worker Portal",   dateAdded: "02 Jun 2026", status: "Active"   },
  { empId: "EMP-004", firstName: "Padma",   lastName: "Veni",     role: "Weaver",       mobile: "+91 65432 10987", portal: "Weaver Portal",   dateAdded: "02 Jun 2026", status: "Active"   },
  { empId: "EMP-006", firstName: "Kavitha", lastName: "Devi",     role: "Shop Staff",   mobile: "+91 43210 98765", portal: "Shop Portal",     dateAdded: "03 Jun 2026", status: "Active"   },
  { empId: "EMP-007", firstName: "Ramesh",  lastName: "Babu",     role: "Worker Staff", mobile: "+91 32109 87654", portal: "Worker Portal",   dateAdded: "05 Jun 2026", status: "Active"   },
  { empId: "EMP-008", firstName: "Lakshmi", lastName: "Patel",    role: "Admin",        mobile: "+91 21098 76543", portal: "Admin Portal",    dateAdded: "08 Jun 2026", status: "Inactive" },
];

// ═══════════════════════════════════════════════════════════════════════════
// SHARED ATOMS
// ═══════════════════════════════════════════════════════════════════════════
function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: 4, height: 22, borderRadius: 2, background: T.royalBurgundy, flexShrink: 0 }} />
        <span style={{ fontFamily: F.ui, fontSize: 18, fontWeight: 600, color: T.luxuryBrown }}>{children}</span>
      </div>
      {action}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const c = ROLE_COLORS[role] ?? { bg: "rgba(139,112,96,0.10)", text: T.taupe, border: "rgba(139,112,96,0.15)" };
  return (
    <span style={{ display: "inline-block", background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 999, padding: "3px 10px", fontFamily: F.ui, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" as const }}>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "Active";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: active ? T.greenBg : "rgba(139,112,96,0.09)", color: active ? T.green : T.taupe, border: `1px solid ${active ? "rgba(30,102,64,0.18)" : "rgba(139,112,96,0.15)"}`, borderRadius: 999, padding: "3px 10px", fontFamily: F.ui, fontSize: 11, fontWeight: 600 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: active ? T.green : T.taupe, flexShrink: 0 }} />
      {status}
    </span>
  );
}

function FieldFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  (e.target as HTMLElement).style.borderColor = T.royalBurgundy;
}
function FieldBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  (e.target as HTMLElement).style.borderColor = "rgba(110,15,45,0.18)";
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW PROFILE MODAL
// ═══════════════════════════════════════════════════════════════════════════
function ViewProfileModal({ member, onClose, onEdit }: {
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

// ═══════════════════════════════════════════════════════════════════════════
// EDIT MODAL
// ═══════════════════════════════════════════════════════════════════════════
function EditModal({ member, onClose, onSave }: {
  member: FinishingStaffMember;
  onClose: () => void;
  onSave: (updates: Partial<FinishingStaffMember>) => void;
}) {
  const [firstName,      setFirstName]      = useState(member.firstName);
  const [lastName,       setLastName]       = useState(member.lastName);
  const [mobile,         setMobile]         = useState(member.mobile);
  const [email,          setEmail]          = useState(member.email);
  const [empId,          setEmpId]          = useState(member.empId);
  const [specialisation, setSpecialisation] = useState(member.specialisation);
  const [notes,          setNotes]          = useState(member.notes);

  const canSave = firstName.trim() && lastName.trim() && mobile.trim();

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(61,14,26,0.45)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: EASE }}
        style={{ position: "relative", width: 580, maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 20, boxShadow: "0 24px 80px rgba(61,14,26,0.22)", overflow: "hidden" }}
      >
        {/* Header */}
        <div style={{ background: T.darkBurgundy, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#fff" }}>
            Edit Finishing Staff Profile
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.10)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={15} color="#fff" />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
          <div>
            <label style={labelStyle}>First Name <span style={{ color: T.crimson }}>*</span></label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
          </div>
          <div>
            <label style={labelStyle}>Last Name <span style={{ color: T.crimson }}>*</span></label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
          </div>
          <div>
            <label style={labelStyle}>Mobile <span style={{ color: T.crimson }}>*</span></label>
            <input value={mobile} onChange={e => setMobile(e.target.value)} style={inputStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
          </div>
          <div>
            <label style={labelStyle}>Email <span style={{ color: T.taupe, fontWeight: 400 }}>— Optional</span></label>
            <input value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
          </div>
          <div>
            <label style={labelStyle}>Employee ID <span style={{ color: T.taupe, fontWeight: 400 }}>— Optional</span></label>
            <input value={empId} onChange={e => setEmpId(e.target.value)} style={inputStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
          </div>
          <div>
            <label style={labelStyle}>Specialisation <span style={{ color: T.taupe, fontWeight: 400 }}>— Optional</span></label>
            <input value={specialisation} onChange={e => setSpecialisation(e.target.value)} placeholder="e.g. Silk finishing" style={inputStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Notes <span style={{ color: T.taupe, fontWeight: 400 }}>— Optional</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize: "none" as const, lineHeight: 1.55 }} onFocus={FieldFocus} onBlur={FieldBlur} />
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
          <button
            onClick={() => { if (canSave) onSave({ firstName, lastName, mobile, email, empId, specialisation, notes }); }}
            disabled={!canSave}
            style={{ flex: 1, height: 46, background: canSave ? `linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)` : "rgba(139,112,96,0.15)", border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: canSave ? "#fff" : T.taupe, cursor: canSave ? "pointer" : "not-allowed" }}
          >
            Save Changes
          </button>
          <button onClick={onClose} style={{ flex: 1, height: 46, background: "transparent", border: `1px solid ${T.borderMed}`, borderRadius: 999, fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: T.royalBurgundy, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export function AddUserPage() {
  const { members, addMember, updateMember, toggleStatus } = useFinishingStaff();

  // ── Form state ──────────────────────────────────────────────────────────
  const [firstName,      setFirstName]      = useState("");
  const [lastName,       setLastName]       = useState("");
  const [mobile,         setMobile]         = useState("");
  const [email,          setEmail]          = useState("");
  const [role,           setRole]           = useState("");
  const [empId,          setEmpId]          = useState("");
  const [specialisation, setSpecialisation] = useState("");
  const [notes,          setNotes]          = useState("");
  const [showSuccess,    setShowSuccess]    = useState(false);
  const [createdUser,    setCreatedUser]    = useState<{ name: string; role: string; mobile: string } | null>(null);

  // ── Table state ─────────────────────────────────────────────────────────
  const [searchQ,        setSearchQ]        = useState("");
  const [roleFilter,     setRoleFilter]     = useState("All Roles");
  const [page,           setPage]           = useState(1);
  const ROWS_PER_PAGE = 7;

  // ── Modal state ─────────────────────────────────────────────────────────
  const [viewingMember,  setViewingMember]  = useState<FinishingStaffMember | null>(null);
  const [editingMember,  setEditingMember]  = useState<FinishingStaffMember | null>(null);

  const portal = role ? ROLE_TO_PORTAL[role] ?? "" : "";
  const isFinishing = role === "Finishing Staff";
  const canSubmit = firstName.trim() && lastName.trim() && mobile.trim() && role;

  function handleSubmit() {
    if (!canSubmit) return;
    if (isFinishing) {
      addMember({ empId, firstName, lastName, mobile, email, specialisation, notes, status: "Active" });
    }
    setCreatedUser({ name: `${firstName} ${lastName}`, role, mobile });
    setShowSuccess(true);
    resetForm();
  }

  function resetForm() {
    setFirstName(""); setLastName(""); setMobile(""); setEmail("");
    setRole(""); setEmpId(""); setSpecialisation(""); setNotes("");
  }

  function handleCancel() { resetForm(); setShowSuccess(false); }

  // ── Build unified table rows ─────────────────────────────────────────────
  // Static non-finishing rows + finishing staff from context
  type TableRow = {
    empId: string; firstName: string; lastName: string; role: string;
    mobile: string; portal: string; dateAdded: string; status: string;
    finishingMember?: FinishingStaffMember;
  };

  const allRows: TableRow[] = useMemo(() => [
    ...STATIC_USERS.map(u => ({ ...u })),
    ...members.map(m => ({
      empId: m.empId, firstName: m.firstName, lastName: m.lastName,
      role: "Finishing Staff", mobile: m.mobile,
      portal: "Finishing Staff (No Portal)", dateAdded: m.dateAdded,
      status: m.status, finishingMember: m,
    })),
  ], [members]);

  const filtered = useMemo(() => allRows.filter(u => {
    const q = searchQ.toLowerCase();
    const matchSearch = !q || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.mobile.includes(q) || u.empId.toLowerCase().includes(q);
    const matchRole = roleFilter === "All Roles" || u.role === roleFilter;
    return matchSearch && matchRole;
  }), [allRows, searchQ, roleFilter]);

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const pagedRows  = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const totalFinishing = members.length;
  const totalAll       = STATIC_USERS.length + members.length;

  return (
    <div style={{ background: T.silkCream, minHeight: "100vh", fontFamily: F.ui }}>

      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{ background: T.darkBurgundy, position: "relative", overflow: "hidden", minHeight: 200, display: "flex", alignItems: "stretch" }}
      >
        <div style={{ flex: 1, padding: "44px 56px 48px", zIndex: 10, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ width: 28, height: 1, background: T.antiqueGold }} />
            <span style={{ fontFamily: F.mono, fontSize: 9, color: `${T.antiqueGold}80`, letterSpacing: "1.5px", textTransform: "uppercase" as const }}>
              SINCE 1999 · USER MANAGEMENT
            </span>
          </div>
          <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 48, color: "#fff", margin: "0 0 4px", lineHeight: 1.1 }}>
            Add New User
          </h1>
          <div style={{ fontFamily: F.display, fontWeight: 500, fontStyle: "italic", fontSize: 30, color: T.antiqueGold, marginBottom: 16, lineHeight: 1.2 }}>
            &amp; User Management
          </div>
          <p style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,255,255,0.60)", maxWidth: 520, margin: 0, lineHeight: 1.65 }}>
            Create login accounts for staff across all portals. Each user logs in using their mobile number and a one-time OTP sent via WhatsApp.
          </p>
        </div>
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, marginRight: 56, alignItems: "flex-end", justifyContent: "center", zIndex: 10, position: "relative" }}>
          {[
            { label: `${totalAll} Total Users`, dot: T.antiqueGold },
            { label: "5 Portals Covered", dot: "#E7C983" },
            { label: "OTP Login via WhatsApp", dot: T.green },
          ].map((chip, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", backdropFilter: "blur(8px)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, fontFamily: F.ui, fontSize: 13, color: "#fff", whiteSpace: "nowrap" as const }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: chip.dot, flexShrink: 0 }} />
              {chip.label}
            </div>
          ))}
        </div>
        {[300, 440, 580].map((sz, i) => (
          <div key={i} style={{ position: "absolute", right: -sz * 0.3, bottom: -sz * 0.4, width: sz, height: sz, borderRadius: "50%", border: `1px solid rgba(200,155,71,${0.10 - i * 0.025})`, pointerEvents: "none" }} />
        ))}
      </motion.div>

      {/* ── BODY ─────────────────────────────────────────────────────────────── */}
      <div style={{ padding: "40px 56px 80px", maxWidth: 1400, margin: "0 auto" }}>

        {/* STAT STRIP */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 40 }}
        >
          {[
            { icon: <Users size={20} color={T.royalBurgundy} />,  val: String(totalAll),        label: "Total Users",      sub: "Across all portals",      accent: T.royalBurgundy, bg: "rgba(110,15,45,0.05)",   border: T.borderDef },
            { icon: <Shield size={20} color={T.antiqueGold} />,   val: "7",                     label: "Admins",           sub: "Full-access accounts",    accent: T.antiqueGold,   bg: T.bgGold,                 border: T.borderGold },
            { icon: <Briefcase size={20} color={T.green} />,      val: "2",                     label: "Worker Staff",     sub: "Operations team",         accent: T.green,         bg: T.greenBg,                border: "rgba(30,102,64,0.16)" },
            { icon: <Sparkles size={20} color={T.blue} />,        val: String(totalFinishing),  label: "Finishing Staff",  sub: "Assigned + managed here", accent: T.blue,          bg: "rgba(44,74,139,0.07)",   border: "rgba(44,74,139,0.15)" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", border: `1px solid ${s.border}`, borderRadius: 16, padding: "22px 24px", boxShadow: "0 2px 12px rgba(44,24,16,0.06)", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 34, color: s.accent, lineHeight: 1.1, letterSpacing: "-0.5px" }}>{s.val}</div>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown, marginTop: 2 }}>{s.label}</div>
                <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 1 }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── ADD NEW USER FORM ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: EASE }}
          style={{ marginBottom: 40 }}
        >
          <div style={{ ...cardStyle, borderRadius: 20 }}>
            <div style={{ padding: "22px 28px 0" }}>
              <SectionTitle>Add New User</SectionTitle>
            </div>

            <div style={{ padding: "0 28px 28px" }}>
              <AnimatePresence mode="wait">
                {showSuccess ? (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} style={{ paddingTop: 12 }}>
                    <div style={{ background: T.greenBg, border: "1px solid rgba(30,102,64,0.20)", borderRadius: 16, padding: "32px 28px", textAlign: "center" as const, marginBottom: 20 }}>
                      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(30,102,64,0.12)", border: `2px solid ${T.green}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                        <CheckCircle2 size={32} color={T.green} />
                      </div>
                      <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24, color: T.luxuryBrown, marginBottom: 6 }}>User Account Created</div>
                      <div style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 600, color: T.royalBurgundy, marginBottom: 16 }}>{createdUser?.name}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" as const }}>
                        {createdUser && <RoleBadge role={createdUser.role} />}
                        <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>Portal: {createdUser && ROLE_TO_PORTAL[createdUser.role]}</span>
                      </div>
                      <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0, lineHeight: 1.65 }}>
                        Login credentials have been sent to <strong style={{ color: T.luxuryBrown }}>{createdUser?.mobile}</strong> via WhatsApp.<br />
                        The user can now log in using their mobile number and OTP.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <button onClick={() => setShowSuccess(false)} style={{ flex: 1, height: 50, background: `linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <UserPlus size={16} /> Add Another User
                      </button>
                      <button onClick={() => setShowSuccess(false)} style={{ flex: 1, height: 50, background: "transparent", border: `1px solid ${T.borderMed}`, borderRadius: 999, fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: T.royalBurgundy, cursor: "pointer" }}>
                        Done
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <div style={{ height: 1, background: T.borderDef, margin: "0 0 24px" }} />

                    {/* Finishing Staff extra-fields callout banner */}
                    <AnimatePresence>
                      {isFinishing && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                          animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          transition={{ duration: 0.25, ease: EASE }}
                          style={{ overflow: "hidden" }}
                        >
                          <div style={{ background: "rgba(44,74,139,0.07)", border: "1px solid rgba(44,74,139,0.18)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                            <Sparkles size={15} color={T.blue} style={{ flexShrink: 0 }} />
                            <span style={{ fontFamily: F.ui, fontSize: 13, color: T.blue }}>
                              Finishing Staff — extra fields (Specialisation) appear below. These are saved to the shared staff directory and visible in the Worker Staff portal for assignment.
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" }}>

                      {/* ─ Col 1 ─ */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                        <div>
                          <label style={labelStyle}>First Name <span style={{ color: T.crimson }}>*</span></label>
                          <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Ravi" style={inputStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
                        </div>
                        <div>
                          <label style={labelStyle}>Last Name <span style={{ color: T.crimson }}>*</span></label>
                          <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Kumar" style={inputStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
                        </div>
                        <div>
                          <label style={labelStyle}>Mobile Number <span style={{ color: T.crimson }}>*</span></label>
                          <div style={{ position: "relative" }}>
                            <Phone size={14} color={T.taupe} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                            <input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+91 98765 43210" type="tel" style={{ ...inputStyle, paddingLeft: 36 }} onFocus={FieldFocus} onBlur={FieldBlur} />
                          </div>
                          <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
                            <Shield size={10} color={T.antiqueGold} /> This number will be used for OTP login via WhatsApp
                          </div>
                        </div>
                        <div>
                          <label style={labelStyle}>Email ID <span style={{ color: T.taupe, fontWeight: 400 }}>— Optional</span></label>
                          <div style={{ position: "relative" }}>
                            <Mail size={14} color={T.taupe} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="name@bksilks.com" type="email" style={{ ...inputStyle, paddingLeft: 36 }} onFocus={FieldFocus} onBlur={FieldBlur} />
                          </div>
                        </div>
                      </div>

                      {/* ─ Col 2 ─ */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                        {/* Role */}
                        <div>
                          <label style={labelStyle}>Role <span style={{ color: T.crimson }}>*</span></label>
                          <div style={{ position: "relative" }}>
                            <select value={role} onChange={e => setRole(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer", paddingRight: 36 }} onFocus={FieldFocus} onBlur={FieldBlur}>
                              <option value="">Select a role…</option>
                              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <ChevronDown size={14} color={T.taupe} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                          </div>
                          {role && <div style={{ marginTop: 8 }}><RoleBadge role={role} /></div>}
                        </div>

                        {/* Portal Access — auto-filled */}
                        <div>
                          <label style={labelStyle}>Portal Access <span style={{ color: T.taupe, fontWeight: 400 }}>— Auto-filled</span></label>
                          <div style={{ position: "relative" }}>
                            <Lock size={14} color={T.taupe} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                            <input readOnly value={portal || "Determined by selected role"} style={{ ...inputStyle, paddingLeft: 36, background: "rgba(245,232,208,0.40)", color: portal ? T.royalBurgundy : T.taupe, cursor: "default", fontWeight: portal ? 500 : 400 }} />
                          </div>
                        </div>

                        {/* Employee ID */}
                        <div>
                          <label style={labelStyle}>Employee ID <span style={{ color: T.taupe, fontWeight: 400 }}>— Optional</span></label>
                          <input value={empId} onChange={e => setEmpId(e.target.value)} placeholder="e.g. EMP-009" style={inputStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
                        </div>

                        {/* Specialisation — Finishing Staff only */}
                        <AnimatePresence>
                          {isFinishing && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.22, ease: EASE }}
                              style={{ overflow: "hidden" }}
                            >
                              <label style={labelStyle}>
                                Specialisation <span style={{ color: T.taupe, fontWeight: 400 }}>— Optional</span>
                              </label>
                              <div style={{ position: "relative" }}>
                                <Sparkles size={14} color={T.blue} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                                <input
                                  value={specialisation}
                                  onChange={e => setSpecialisation(e.target.value)}
                                  placeholder="e.g. Silk finishing, Zari polishing"
                                  style={{ ...inputStyle, paddingLeft: 36 }}
                                  onFocus={FieldFocus} onBlur={FieldBlur}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Notes */}
                        <div>
                          <label style={labelStyle}>Notes <span style={{ color: T.taupe, fontWeight: 400 }}>— Optional</span></label>
                          <div style={{ position: "relative" }}>
                            <FileText size={14} color={T.taupe} style={{ position: "absolute", left: 12, top: 12, pointerEvents: "none" }} />
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={isFinishing ? "Any additional info about this finishing staff member…" : "Any additional notes for this user…"} rows={3} style={{ ...inputStyle, paddingLeft: 36, resize: "none" as const, lineHeight: 1.55 }} onFocus={FieldFocus} onBlur={FieldBlur} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ height: 1, background: T.borderDef, margin: "24px 0" }} />

                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <motion.button whileHover={{ scale: canSubmit ? 1.02 : 1 }} whileTap={{ scale: canSubmit ? 0.97 : 1 }} onClick={handleSubmit} disabled={!canSubmit}
                        style={{ height: 50, padding: "0 32px", background: canSubmit ? `linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)` : "rgba(139,112,96,0.15)", border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: canSubmit ? "#FFF" : T.taupe, cursor: canSubmit ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8, boxShadow: canSubmit ? "0 4px 20px rgba(110,15,45,0.25)" : "none", transition: "all 0.2s" }}>
                        <UserPlus size={16} /> Create User Account
                      </motion.button>
                      <button onClick={handleCancel} style={{ height: 50, padding: "0 28px", background: "transparent", border: `1px solid ${T.borderMed}`, borderRadius: 999, fontFamily: F.ui, fontWeight: 500, fontSize: 14, color: T.royalBurgundy, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                        <X size={15} /> Cancel
                      </button>
                      {!canSubmit && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginLeft: 4 }}>Fill in all required fields to continue</span>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ── ALL USERS TABLE ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.26, ease: EASE }}>
          <div style={{ ...cardStyle, borderRadius: 20 }}>
            {/* Toolbar */}
            <div style={{ padding: "22px 28px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
              <SectionTitle>
                All Users
                <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, background: "rgba(139,112,96,0.10)", padding: "2px 9px", borderRadius: 999, marginLeft: 10 }}>{allRows.length} total</span>
              </SectionTitle>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" as const }}>
                {/* Quick-filter pills */}
                <div style={{ display: "flex", gap: 6 }}>
                  {["All Roles", "Finishing Staff"].map(pill => (
                    <button key={pill}
                      onClick={() => { setRoleFilter(pill); setPage(1); }}
                      style={{ padding: "5px 12px", borderRadius: 999, border: `1px solid ${roleFilter === pill ? "rgba(44,74,139,0.40)" : T.borderDef}`, background: roleFilter === pill ? "rgba(44,74,139,0.09)" : "transparent", fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: roleFilter === pill ? T.blue : T.taupe, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" as const }}
                    >{pill}</button>
                  ))}
                </div>
                {/* Search */}
                <div style={{ position: "relative" }}>
                  <Search size={14} color={T.taupe} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(1); }} placeholder="Search users…" style={{ ...inputStyle, width: 220, paddingLeft: 34, height: 38, fontSize: 13 }} />
                </div>
                {/* Role filter dropdown */}
                <div style={{ position: "relative" }}>
                  <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} style={{ ...inputStyle, width: 170, height: 38, fontSize: 13, appearance: "none", paddingRight: 28, cursor: "pointer" }}>
                    <option value="All Roles">All Roles</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ChevronDown size={13} color={T.taupe} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" as const }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 140px 160px 1fr 110px 90px 170px", gap: 0, padding: "10px 28px", background: "rgba(110,15,45,0.03)", borderTop: `1px solid ${T.borderDef}`, borderBottom: `1px solid ${T.borderDef}`, minWidth: 980 }}>
                {["Emp ID", "Full Name", "Role", "Mobile Number", "Portal Access", "Date Added", "Status", "Actions"].map(col => (
                  <div key={col} style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{col}</div>
                ))}
              </div>

              {/* Rows */}
              {pagedRows.length === 0 ? (
                <div style={{ padding: "40px 28px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No users found matching your filters.</div>
              ) : pagedRows.map((u, i) => {
                const fm = u.finishingMember;
                return (
                  <div key={u.empId + i}
                    style={{ display: "grid", gridTemplateColumns: "100px 1fr 140px 160px 1fr 110px 90px 170px", gap: 0, padding: "15px 28px", borderBottom: i < pagedRows.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 0 ? "#fff" : "rgba(247,242,234,0.40)", alignItems: "center", minWidth: 980, transition: "background 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(110,15,45,0.025)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = i % 2 === 0 ? "#fff" : "rgba(247,242,234,0.40)"; }}
                  >
                    <div style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>{u.empId}</div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${ROLE_COLORS[u.role]?.text ?? T.taupe}, ${T.darkBurgundy})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 11, color: "#FFF" }}>{u.firstName[0]}{u.lastName[0]}</span>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{u.firstName} {u.lastName}</div>
                        {fm?.specialisation && (
                          <div style={{ fontFamily: F.ui, fontSize: 10, color: T.blue, marginTop: 1 }}>{fm.specialisation}</div>
                        )}
                      </div>
                    </div>

                    <div><RoleBadge role={u.role} /></div>
                    <div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{u.mobile}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{u.portal}</div>
                    <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{u.dateAdded}</div>
                    <div><StatusBadge status={u.status} /></div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 5 }}>
                      <button
                        onClick={() => fm && setEditingMember(fm)}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "transparent", fontFamily: F.ui, fontSize: 11, fontWeight: 500, color: T.luxuryBrown, cursor: "pointer" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(110,15,45,0.05)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                      >
                        <Edit2 size={11} color={T.royalBurgundy} /> Edit
                      </button>
                      <button
                        onClick={() => fm && toggleStatus(fm.id)}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 8px", border: `1px solid rgba(192,57,43,0.18)`, borderRadius: 7, background: "transparent", fontFamily: F.ui, fontSize: 11, fontWeight: 500, color: T.crimson, cursor: fm ? "pointer" : "default", opacity: fm ? 1 : 0.5 }}
                        onMouseEnter={e => { if (fm) (e.currentTarget as HTMLButtonElement).style.background = T.crimsonBg; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                      >
                        <ShieldOff size={11} /> {u.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                      {fm && (
                        <button
                          onClick={() => setViewingMember(fm)}
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 8px", border: `1px solid rgba(44,74,139,0.22)`, borderRadius: 7, background: "transparent", fontFamily: F.ui, fontSize: 11, fontWeight: 500, color: T.blue, cursor: "pointer" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(44,74,139,0.07)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                        >
                          <Eye size={11} /> View
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div style={{ padding: "16px 28px", borderTop: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                Showing {Math.min((page - 1) * ROWS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ROWS_PER_PAGE, filtered.length)} of {filtered.length} users
              </span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.borderDef}`, background: "transparent", cursor: page === 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page === 1 ? 0.4 : 1, transition: "all 0.15s" }}
                  onMouseEnter={e => { if (page > 1) (e.currentTarget as HTMLButtonElement).style.background = "rgba(110,15,45,0.05)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                  <ChevronLeft size={14} color={T.luxuryBrown} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                  <button key={pg} onClick={() => setPage(pg)}
                    style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${pg === page ? T.royalBurgundy : T.borderDef}`, background: pg === page ? T.royalBurgundy : "transparent", fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: pg === page ? "#FFF" : T.luxuryBrown, cursor: "pointer", transition: "all 0.15s" }}
                  >{pg}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.borderDef}`, background: "transparent", cursor: page === totalPages ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page === totalPages ? 0.4 : 1, transition: "all 0.15s" }}
                  onMouseEnter={e => { if (page < totalPages) (e.currentTarget as HTMLButtonElement).style.background = "rgba(110,15,45,0.05)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                  <ChevronRight size={14} color={T.luxuryBrown} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {viewingMember && (
          <ViewProfileModal
            key="view"
            member={viewingMember}
            onClose={() => setViewingMember(null)}
            onEdit={() => { setEditingMember(viewingMember); setViewingMember(null); }}
          />
        )}
        {editingMember && (
          <EditModal
            key="edit"
            member={editingMember}
            onClose={() => setEditingMember(null)}
            onSave={updates => { updateMember(editingMember.id, updates); setEditingMember(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
