import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, ChevronDown, UserPlus, CheckCircle2, Edit2,
  ShieldOff, Users, Shield, X, ChevronLeft, ChevronRight, Phone, Mail,
  Briefcase, Lock, FileText, Eye, Sparkles, Layers, ShoppingBag,
  ShieldCheck, ShieldHalf, XCircle, Hash, Calculator,
} from "lucide-react";
import { useFinishingStaff, FinishingStaffMember } from "../../finishing/contexts/FinishingStaffContext";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../shared/ui/DateFilterBar";
import {
  T, F, EASE, cardStyle, inputStyle, labelStyle,
  ROLE_TO_PORTAL, ROLE_COLORS, ROLES, ACCESS_LEVELS, AccessLevel, ACCESS_LEVEL_META,
  FieldFocus, FieldBlur,
} from "./theme";
import { nextEmployeeId, todayFormatted, TableRow, STATIC_USERS } from "./utils";
import { SectionTitle, RoleBadge, AccessBadge, StatusBadge } from "./UserBadges";
import { ViewProfileModal } from "./ViewProfileModal";
import { EditModal } from "./EditModal";
import { UserTable } from "./UserTable";
import { AddUserForm } from "./AddUserForm";

const ROLE_ICONS: Record<string, React.ElementType> = {
  "Admin": Shield,
  "Worker Staff": Briefcase,
  "Finishing Staff": Sparkles,
  "Weaver": Layers,
  "Shop Staff": ShoppingBag,
  "Accountant": Calculator,
};

export function AddUserPage() {
  const { members, addMember, updateMember, toggleStatus } = useFinishingStaff();

  // ── Form state ──────────────────────────────────────────────────────────
  const [firstName,      setFirstName]      = useState("");
  const [lastName,       setLastName]       = useState("");
  const [mobile,         setMobile]         = useState("");
  const [email,          setEmail]          = useState("");
  const [role,           setRole]           = useState("");
  const [accessLevel,    setAccessLevel]    = useState<AccessLevel>("Full Access");
  const [specialisation, setSpecialisation] = useState("");
  const [notes,          setNotes]          = useState("");
  const [showSuccess,    setShowSuccess]    = useState(false);
  const [createdUser,    setCreatedUser]    = useState<{ name: string; role: string; mobile: string; empId: string; accessLevel?: AccessLevel } | null>(null);
  // Non-finishing users created here (Admin / Worker / Weaver / Shop Staff) —
  // finishing staff persist through FinishingStaffContext instead.
  const [customUsers,    setCustomUsers]    = useState<TableRow[]>([]);

  // ── Table state ─────────────────────────────────────────────────────────
  const [searchQ,        setSearchQ]        = useState("");
  const [roleFilter,     setRoleFilter]     = useState("All Roles");
  const [dateFilter,     setDateFilter]     = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [page,           setPage]           = useState(1);
  const ROWS_PER_PAGE = 7;

  // ── Modal state ─────────────────────────────────────────────────────────
  const [viewingMember,  setViewingMember]  = useState<FinishingStaffMember | null>(null);
  const [editingMember,  setEditingMember]  = useState<FinishingStaffMember | null>(null);

  const portal = role ? ROLE_TO_PORTAL[role] ?? "" : "";
  const isFinishing = role === "Finishing Staff";
  const isAdmin = role === "Admin";
  const canSubmit = firstName.trim() && lastName.trim() && mobile.trim() && role;

  // ── Build unified table rows ─────────────────────────────────────────────
  // Static non-finishing rows + locally-created non-finishing rows + finishing
  // staff from the shared context.
  const allRows: TableRow[] = useMemo(() => [
    ...STATIC_USERS.map(u => ({ ...u })),
    ...customUsers,
    ...members.map(m => ({
      empId: m.empId, firstName: m.firstName, lastName: m.lastName,
      role: "Finishing Staff", mobile: m.mobile,
      portal: "Finishing Staff (No Portal)", dateAdded: m.dateAdded,
      status: m.status, finishingMember: m,
    })),
  ], [members, customUsers]);

  // The Employee ID field is never typed — it's always one past the highest
  // EMP-### seen across every existing user record.
  const autoEmpId = useMemo(() => nextEmployeeId(allRows.map(u => u.empId)), [allRows]);

  function handleSubmit() {
    if (!canSubmit) return;
    const empId = autoEmpId;
    if (isFinishing) {
      addMember({ empId, firstName, lastName, mobile, email, specialisation, notes, status: "Active" });
    } else {
      setCustomUsers(prev => [...prev, {
        empId, firstName, lastName, role, mobile,
        portal: ROLE_TO_PORTAL[role] ?? "", dateAdded: todayFormatted(), status: "Active",
        ...(isAdmin ? { accessLevel } : {}),
      }]);
    }
    setCreatedUser({ name: `${firstName} ${lastName}`, role, mobile, empId, accessLevel: isAdmin ? accessLevel : undefined });
    setShowSuccess(true);
    resetForm();
  }

  function resetForm() {
    setFirstName(""); setLastName(""); setMobile(""); setEmail("");
    setRole(""); setAccessLevel("Full Access"); setSpecialisation(""); setNotes("");
  }

  function handleCancel() { resetForm(); setShowSuccess(false); }

  const filtered = useMemo(() => allRows.filter(u => {
    const q = searchQ.toLowerCase();
    const matchSearch = !q || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.mobile.includes(q) || u.empId.toLowerCase().includes(q);
    const matchRole = roleFilter === "All Roles" || u.role === roleFilter;
    const matchDate = matchesDateFilter(u.dateAdded, dateFilter);
    return matchSearch && matchRole && matchDate;
  }), [allRows, searchQ, roleFilter, dateFilter]);

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const pagedRows  = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  // ── Stats — computed live off allRows so every role/status/access figure
  // reflects users actually on record, not a hardcoded snapshot. ─────────────
  const totalAll      = allRows.length;
  const totalActive   = allRows.filter(u => u.status === "Active").length;
  const totalInactive = totalAll - totalActive;

  const roleStats = useMemo(() => ROLES.map(r => {
    const rows = allRows.filter(u => u.role === r);
    const stat: { role: string; count: number; active: number; fullAccess?: number; semiAccess?: number } = {
      role: r, count: rows.length, active: rows.filter(u => u.status === "Active").length,
    };
    if (r === "Admin") {
      stat.fullAccess = rows.filter(u => u.accessLevel === "Full Access").length;
      stat.semiAccess = rows.filter(u => u.accessLevel === "Semi Access").length;
    }
    return stat;
  }), [allRows]);

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

        {/* STAT STRIP — overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}
        >
          {[
            { icon: <Users size={20} color={T.royalBurgundy} />,  val: String(totalAll),      label: "Total Users",    sub: "Across all portals",     accent: T.royalBurgundy, bg: "rgba(110,15,45,0.05)", border: T.borderDef },
            { icon: <CheckCircle2 size={20} color={T.green} />,   val: String(totalActive),   label: "Active Users",   sub: "Currently able to log in", accent: T.green,        bg: T.greenBg,               border: "rgba(30,102,64,0.16)" },
            { icon: <XCircle size={20} color={T.crimson} />,      val: String(totalInactive), label: "Inactive Users", sub: "Deactivated accounts",    accent: T.crimson,       bg: T.crimsonBg,             border: "rgba(192,57,43,0.16)" },
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

        {/* STAT STRIP — staff by role, computed live from allRows */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14, ease: EASE }}
          style={{ display: "grid", gridTemplateColumns: `repeat(${ROLES.length}, 1fr)`, gap: 16, marginBottom: 40 }}
        >
          {roleStats.map((s, i) => {
            const c = ROLE_COLORS[s.role] ?? { bg: "rgba(139,112,96,0.10)", text: T.taupe, border: "rgba(139,112,96,0.15)" };
            const Icon = ROLE_ICONS[s.role] ?? Users;
            return (
              <div key={s.role} style={{ background: "#fff", border: `1px solid ${c.border}`, borderRadius: 16, padding: "20px 20px", boxShadow: "0 2px 12px rgba(44,24,16,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} color={c.text} />
                  </div>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 28, color: c.text, lineHeight: 1 }}>{s.count}</div>
                </div>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12.5, color: T.luxuryBrown }}>{s.role}</div>
                {s.role === "Admin" ? (
                  <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>
                    {s.fullAccess} Full · {s.semiAccess} Semi
                  </div>
                ) : (
                  <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>{s.active} active</div>
                )}
              </div>
            );
          })}
        </motion.div>

        {/* ── ADD NEW USER FORM ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: EASE }}
          style={{ marginBottom: 40 }}
        >
          <AddUserForm
            showSuccess={showSuccess}
            setShowSuccess={setShowSuccess}
            createdUser={createdUser}
            isFinishing={isFinishing}
            isAdmin={isAdmin}
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            mobile={mobile}
            setMobile={setMobile}
            email={email}
            setEmail={setEmail}
            role={role}
            setRole={setRole}
            portal={portal}
            autoEmpId={autoEmpId}
            accessLevel={accessLevel}
            setAccessLevel={setAccessLevel}
            specialisation={specialisation}
            setSpecialisation={setSpecialisation}
            notes={notes}
            setNotes={setNotes}
            canSubmit={Boolean(canSubmit)}
            handleSubmit={handleSubmit}
            handleCancel={handleCancel}
          />
        </motion.div>

        {/* ── ALL USERS TABLE ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.26, ease: EASE }}>
          <UserTable
            allRows={allRows}
            searchQ={searchQ}
            setSearchQ={setSearchQ}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            page={page}
            setPage={setPage}
            pagedRows={pagedRows}
            filtered={filtered}
            totalPages={totalPages}
            ROWS_PER_PAGE={ROWS_PER_PAGE}
            customUsers={customUsers}
            setCustomUsers={setCustomUsers}
            toggleStatus={toggleStatus}
            setEditingMember={setEditingMember}
            setViewingMember={setViewingMember}
            cardStyle={cardStyle}
            inputStyle={inputStyle}
          />
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
