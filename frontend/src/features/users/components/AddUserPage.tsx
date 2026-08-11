import React, { useState, useMemo, useEffect, useCallback } from "react";
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
import { formatBackendDate, TableRow } from "./utils";
import { SectionTitle, RoleBadge, AccessBadge, StatusBadge } from "./UserBadges";
import { ViewProfileModal } from "./ViewProfileModal";
import { EditModal } from "./EditModal";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { UserTable } from "./UserTable";
import { AddUserForm, WeaverFieldsState } from "./AddUserForm";
import { ApiError } from "../../../shared/api/client";
import { Button } from "../../../shared/ui/primitives";
import {
  BackendUser, FRONTEND_TO_BACKEND_ROLE, BACKEND_TO_FRONTEND_ROLE,
  backendAccessLevelToFrontend, frontendAccessLevelToBackend, usersApi,
} from "../../../shared/api/users";
import { BackendWeaver, weaversApi } from "../../../shared/api/weavers";

// Weavers registered directly via the Weavers module (not through Add User)
// have no User row at all, so they'd otherwise be invisible here. Matched
// against backendUsers by phone number to avoid double-listing a weaver that
// *does* have a linked User row (see users.service.ts's auto-link on create).
function weaverToTableRow(w: BackendWeaver): TableRow {
  return {
    empId: w.code,
    firstName: w.firstName,
    lastName: w.lastName,
    role: "Weaver",
    mobile: w.phone,
    portal: ROLE_TO_PORTAL["Weaver"] ?? "",
    dateAdded: formatBackendDate(w.createdAt),
    status: w.status === "ACTIVE" ? "Active" : "Inactive",
    weaverOnlyId: w.id,
  };
}

function backendUserToTableRow(u: BackendUser): TableRow {
  const frontendRole = BACKEND_TO_FRONTEND_ROLE[u.role];
  return {
    empId: u.empId,
    firstName: u.firstName,
    lastName: u.lastName,
    role: frontendRole,
    mobile: u.mobile,
    portal: ROLE_TO_PORTAL[frontendRole] ?? "",
    dateAdded: formatBackendDate(u.dateAdded),
    status: u.status === "ACTIVE" ? "Active" : "Inactive",
    accessLevel: frontendRole === "Admin" ? backendAccessLevelToFrontend(u.accessLevel) : undefined,
    backendId: u.id,
  };
}

const EMPTY_WEAVER_FIELDS: WeaverFieldsState = {
  photoUrl: "", village: "", looms: "", bankName: "", accountNo: "", ifsc: "",
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  "Admin": Shield,
  "Worker Staff": Briefcase,
  "Finishing Staff": Sparkles,
  "Weaver": Layers,
  "Shop Staff": ShoppingBag,
  "Accountant": Calculator,
};

export function AddUserPage() {
  const { members, addMember, updateMember, toggleStatus, deleteMember } = useFinishingStaff();

  // ── Form state ──────────────────────────────────────────────────────────
  const [firstName,      setFirstName]      = useState("");
  const [lastName,       setLastName]       = useState("");
  const [mobile,         setMobile]         = useState("");
  const [email,          setEmail]          = useState("");
  const [role,           setRole]           = useState("");
  const [accessLevel,    setAccessLevel]    = useState<AccessLevel>("Full Access");
  const [specialisation, setSpecialisation] = useState("");
  const [notes,          setNotes]          = useState("");
  const [weaverFields,   setWeaverFields]   = useState<WeaverFieldsState>(EMPTY_WEAVER_FIELDS);
  const [showSuccess,    setShowSuccess]    = useState(false);
  const [createdUser,    setCreatedUser]    = useState<{ name: string; role: string; mobile: string; empId: string; accessLevel?: AccessLevel } | null>(null);
  const [submitError,    setSubmitError]    = useState<string | null>(null);
  const [submitting,     setSubmitting]     = useState(false);

  // Users fetched from the real backend (Admin / Worker Staff / Weaver / Shop
  // Staff / Accountant). Finishing Staff has no backend User equivalent — it
  // stays on FinishingStaffContext, its own domain (see backend architecture
  // doc §4: finishing_staff is a separate table from users).
  const [backendUsers,   setBackendUsers]   = useState<TableRow[]>([]);
  const [weaverOnlyRows, setWeaverOnlyRows] = useState<TableRow[]>([]);
  const [loadError,      setLoadError]      = useState<string | null>(null);
  const [loading,        setLoading]        = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [usersRes, weaversRes] = await Promise.all([usersApi.list(), weaversApi.list()]);
      const rows = usersRes.items.map(backendUserToTableRow);
      setBackendUsers(rows);
      const linkedMobiles = new Set(rows.map(r => r.mobile));
      setWeaverOnlyRows(
        weaversRes.items.filter(w => !linkedMobiles.has(w.phone)).map(weaverToTableRow),
      );
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

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
  const isWeaver = role === "Weaver";
  const isAdmin = role === "Admin";
  const canSubmit = firstName.trim() && lastName.trim() && mobile.trim() && role;

  // ── Build unified table rows ─────────────────────────────────────────────
  // Backend-sourced users + finishing staff from the shared context.
  const allRows: TableRow[] = useMemo(() => [
    ...backendUsers,
    ...weaverOnlyRows,
    ...members.map(m => ({
      empId: m.empId, firstName: m.firstName, lastName: m.lastName,
      role: "Finishing Staff", mobile: m.mobile,
      portal: "Finishing Staff (No Portal)", dateAdded: m.dateAdded,
      status: m.status, finishingMember: m,
    })),
  ], [members, backendUsers, weaverOnlyRows]);

  // Finishing Staff IDs aren't backend-generated (no User row exists for
  // them), so keep a lightweight local next-id fallback for that path only.
  const nextFinishingEmpId = useMemo(() => {
    const maxNum = allRows.reduce((max, u) => {
      const m = u.empId.match(/(\d+)\s*$/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    return `EMP-${String(maxNum + 1).padStart(3, "0")}`;
  }, [allRows]);

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitError(null);

    if (isFinishing) {
      const empId = nextFinishingEmpId;
      // "Active" matches FinishingStaffContext's FinishingStaffMember.status
      // ("Active"|"Inactive"), a genuine PERSON_STATUS-shaped field — but
      // that type, plus its ~6 other consumers (UserTable.tsx, UserBadges.tsx's
      // StatusBadge, EditModal.tsx, ViewProfileModal.tsx, and this file's own
      // weaverToTableRow/backendUserToTableRow), are all outside this pass's
      // assigned files. Left as a documented exception rather than a partial
      // retype that would desync from its own type definition.
      addMember({ empId, firstName, lastName, mobile, email, specialisation, notes, status: "Active" });
      setCreatedUser({ name: `${firstName} ${lastName}`, role, mobile, empId });
      setShowSuccess(true);
      resetForm();
      return;
    }

    let looms: number | undefined;
    if (isWeaver && weaverFields.looms.trim()) {
      looms = Number(weaverFields.looms);
      if (Number.isNaN(looms) || looms < 0) {
        setSubmitError("Number of looms must be a valid non-negative number.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const created = await usersApi.create({
        firstName,
        lastName,
        mobile,
        email: email.trim() || undefined,
        role: FRONTEND_TO_BACKEND_ROLE[role],
        accessLevel: isAdmin ? frontendAccessLevelToBackend(accessLevel) : undefined,
        ...(isWeaver ? {
          photoUrl: weaverFields.photoUrl || undefined,
          village: weaverFields.village.trim() || undefined,
          looms,
          bankName: weaverFields.bankName.trim() || undefined,
          accountNo: weaverFields.accountNo.trim() || undefined,
          ifsc: weaverFields.ifsc.trim() || undefined,
        } : {}),
      });
      setBackendUsers(prev => [backendUserToTableRow(created), ...prev]);
      setCreatedUser({
        name: `${firstName} ${lastName}`, role, mobile, empId: created.empId,
        accessLevel: isAdmin ? accessLevel : undefined,
      });
      setShowSuccess(true);
      resetForm();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not create the user. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setFirstName(""); setLastName(""); setMobile(""); setEmail("");
    setRole(""); setAccessLevel("Full Access"); setSpecialisation(""); setNotes("");
    setWeaverFields(EMPTY_WEAVER_FIELDS);
  }

  function handleCancel() { resetForm(); setShowSuccess(false); setSubmitError(null); }

  async function handleToggleStatus(row: TableRow) {
    if (row.finishingMember) {
      toggleStatus(row.finishingMember.id);
      return;
    }
    if (row.weaverOnlyId) {
      const nextStatus = row.status === "Active" ? "INACTIVE" : "ACTIVE";
      try {
        const updated = await weaversApi.update(row.weaverOnlyId, { status: nextStatus });
        setWeaverOnlyRows(prev => prev.map(w => (w.weaverOnlyId === updated.id ? weaverToTableRow(updated) : w)));
      } catch {
        // Non-fatal — same pattern as the backend-user path below.
      }
      return;
    }
    if (!row.backendId) return;
    const nextStatus = row.status === "Active" ? "INACTIVE" : "ACTIVE";
    try {
      const updated = await usersApi.updateStatus(row.backendId, nextStatus);
      setBackendUsers(prev => prev.map(u => (u.backendId === row.backendId ? backendUserToTableRow(updated) : u)));
    } catch {
      // Non-fatal — the row simply won't reflect the change; a toast/error
      // banner here would be the next improvement once a notification system exists.
    }
  }

  const [deletingRow,  setDeletingRow]  = useState<TableRow | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [deleteError,  setDeleteError]  = useState<string | null>(null);

  function handleDelete(row: TableRow) {
    setDeleteError(null);
    setDeletingRow(row);
  }

  function cancelDelete() {
    if (deleting) return;
    setDeletingRow(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deletingRow) return;
    const row = deletingRow;
    setDeleting(true);
    setDeleteError(null);
    try {
      if (row.finishingMember) {
        await deleteMember(row.finishingMember.id);
      } else if (row.weaverOnlyId) {
        await weaversApi.remove(row.weaverOnlyId);
        setWeaverOnlyRows(prev => prev.filter(w => w.weaverOnlyId !== row.weaverOnlyId));
      } else if (row.backendId) {
        await usersApi.remove(row.backendId);
        setBackendUsers(prev => prev.filter(u => u.backendId !== row.backendId));
      }
      setDeletingRow(null);
    } catch (err) {
      setDeleteError(
        err instanceof ApiError ? err.message : `Could not delete ${row.firstName} ${row.lastName}. Please try again.`,
      );
    } finally {
      setDeleting(false);
    }
  }

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
    <div style={{ background: T.silkCream, minHeight: "100dvh", fontFamily: F.ui }}>

      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{ background: "#0D0207", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}
      >
        <div style={{ flex: 1, padding: "48px 0 48px 48px", zIndex: 10, position: "relative", maxWidth: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ width: 28, height: 1, background: T.antiqueGold }} />
            <span style={{ fontFamily: F.mono, fontSize: 13, color: `${T.antiqueGold}80`, letterSpacing: "1.5px", textTransform: "uppercase" as const }}>
              SINCE 1999 · USER MANAGEMENT
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" as const, marginBottom: 10 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: 56, color: "#fff", margin: 0, lineHeight: 1.1 }}>
              Add New User
            </h1>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontStyle: "italic", fontSize: 36, color: T.antiqueGold, lineHeight: 1.1 }}>
              &amp; User Management
            </div>
          </div>
          <p style={{ fontFamily: F.ui, fontSize: 18, fontWeight: 400, color: "rgba(255,255,255,0.70)", maxWidth: 600, margin: 0, lineHeight: 1.65 }}>
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
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 38, color: s.accent, lineHeight: 1.1, letterSpacing: "-0.5px" }}>{s.val}</div>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown, marginTop: 2 }}>{s.label}</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>{s.sub}</div>
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
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 30, color: c.text, lineHeight: 1 }}>{s.count}</div>
                </div>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.luxuryBrown }}>{s.role}</div>
                {s.role === "Admin" ? (
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
                    {s.fullAccess} Full · {s.semiAccess} Semi
                  </div>
                ) : (
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{s.active} active</div>
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
          {submitError && (
            <div style={{ background: T.crimsonBg, border: "1px solid rgba(192,57,43,0.25)", borderRadius: 12, padding: "12px 18px", marginBottom: 16, fontFamily: F.ui, fontSize: 13, color: T.crimson }}>
              {submitError}
            </div>
          )}
          <AddUserForm
            showSuccess={showSuccess}
            setShowSuccess={setShowSuccess}
            createdUser={createdUser}
            isFinishing={isFinishing}
            isWeaver={isWeaver}
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
            autoEmpId={isFinishing ? nextFinishingEmpId : "Assigned automatically on save"}
            accessLevel={accessLevel}
            setAccessLevel={setAccessLevel}
            specialisation={specialisation}
            setSpecialisation={setSpecialisation}
            notes={notes}
            setNotes={setNotes}
            weaverFields={weaverFields}
            setWeaverFields={setWeaverFields}
            canSubmit={Boolean(canSubmit) && !submitting}
            handleSubmit={handleSubmit}
            handleCancel={handleCancel}
          />
        </motion.div>

        {loadError && (
          <div style={{ background: T.crimsonBg, border: "1px solid rgba(192,57,43,0.25)", borderRadius: 12, padding: "12px 18px", marginBottom: 16, fontFamily: F.ui, fontSize: 13, color: T.crimson, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Could not load users from the server: {loadError}</span>
            <Button variant="danger-subtle" size="sm" onClick={() => void loadUsers()}>Retry</Button>
          </div>
        )}
        {loading && !loadError && (
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 16 }}>Loading users…</div>
        )}

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
            onToggleStatus={row => void handleToggleStatus(row)}
            onDelete={handleDelete}
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
        {deletingRow && (
          <ConfirmDialog
            key="delete"
            title={`Delete ${deletingRow.firstName} ${deletingRow.lastName}?`}
            message={`This permanently removes this ${deletingRow.role} record and cannot be undone. If they have existing records — batches, QC entries, payments, assignments — deletion will be blocked; deactivate them instead.`}
            confirmLabel="Delete Permanently"
            loading={deleting}
            error={deleteError}
            onConfirm={() => void confirmDelete()}
            onCancel={cancelDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
