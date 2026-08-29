import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Users, Shield,
  Briefcase, Sparkles, Layers, ShoppingBag,
  XCircle, Calculator,
} from "lucide-react";
import { useFinishingStaff, FinishingStaffMember } from "@/features/finishing";
import { DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../shared/ui/DateFilterBar";
import { LuxuryStatsCard } from "@/shared/ui/LuxuryStatsCard";
import {
  T, F, EASE, cardStyle, inputStyle,
  ROLE_TO_PORTAL, ROLE_COLORS, ROLES, AccessLevel,
} from "./theme";
import { formatBackendDate, TableRow } from "./utils";
import { ViewProfileModal } from "./ViewProfileModal";
import { EditModal } from "./EditModal";
import { ViewUserModal } from "./ViewUserModal";
import { EditUserModal, UserEditFields } from "./EditUserModal";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { UserTable } from "./UserTable";
import { AddUserForm, WeaverFieldsState } from "./AddUserForm";
import { ApiError } from "../../../shared/api/client";
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
    email: w.email || undefined,
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
    email: u.email || undefined,
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
  // Generic view/edit for every non-Finishing-Staff row (Admin, Accountant,
  // Shop Staff, Worker Staff, Weaver) — those have no FinishingStaffMember.
  const [viewingRow,     setViewingRow]     = useState<TableRow | null>(null);
  const [editingRow,     setEditingRow]     = useState<TableRow | null>(null);
  const [rowSaveError,   setRowSaveError]   = useState<string | null>(null);
  const [rowSaving,      setRowSaving]      = useState(false);

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

  async function handleSaveRow(row: TableRow, updates: UserEditFields) {
    setRowSaving(true);
    setRowSaveError(null);
    try {
      if (row.weaverOnlyId) {
        const updated = await weaversApi.update(row.weaverOnlyId, {
          firstName: updates.firstName,
          lastName: updates.lastName,
          phone: updates.mobile,
          email: updates.email || undefined,
        });
        setWeaverOnlyRows(prev => prev.map(w => (w.weaverOnlyId === updated.id ? weaverToTableRow(updated) : w)));
      } else if (row.backendId) {
        const updated = await usersApi.update(row.backendId, {
          firstName: updates.firstName,
          lastName: updates.lastName,
          mobile: updates.mobile,
          email: updates.email || undefined,
        });
        setBackendUsers(prev => prev.map(u => (u.backendId === updated.id ? backendUserToTableRow(updated) : u)));
      }
      setEditingRow(null);
    } catch (err) {
      setRowSaveError(err instanceof ApiError ? err.message : "Could not save changes. Please try again.");
    } finally {
      setRowSaving(false);
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
        <div className="px-4 md:px-7 xl:px-14 flex-col xl:flex-row" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 86, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: "clamp(11px, 1.4vw, 13px)", color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 10 }}>
              Since 1999 · User Management &amp; Access Security
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" as const, marginBottom: 8 }}>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: "clamp(32px, 6vw, 52px)", color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>
                Add New User
              </h1>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontStyle: "italic", fontSize: "clamp(20px, 4.5vw, 32px)", color: T.antiqueGold, lineHeight: 1.1 }}>
                &amp; Portal Role Management
              </span>
            </div>
            <p className="max-w-[640px]" style={{ fontFamily: F.ui, fontWeight: 400, fontSize: "clamp(13px, 2vw, 15px)", color: "rgba(255,253,249,0.70)", lineHeight: 1.6, margin: 0 }}>
              Create login accounts for staff across all 5 system portals. Each user logs in securely using their mobile number and a one-time OTP sent directly via WhatsApp.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignSelf: "flex-start", marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, fontFamily: F.ui, fontSize: 13, color: "#FFF", whiteSpace: "nowrap" as const }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.antiqueGold, flexShrink: 0 }} />
              {totalAll} Total Active Accounts
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── FLOATING STATS STRIP ───────────────────────────────────────────── */}
      <div className="px-4 md:px-7 xl:px-14 -mt-6 md:-mt-8 xl:-mt-[36px]" style={{ zIndex: 20, position: "relative" }}>
        <LuxuryStatsCard
          stats={[
            { label: "TOTAL USERS", value: String(totalAll), sub: "Across all 5 portals", icon: <Users size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
            { label: "ACTIVE USERS", value: String(totalActive), sub: "Currently able to log in", icon: <CheckCircle2 size={20} color="rgba(245,232,208,0.90)" />, highlight: true },
            { label: "INACTIVE USERS", value: String(totalInactive), sub: "Deactivated accounts", icon: <XCircle size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
            { label: "AUTHENTICATION", value: "WhatsApp OTP", sub: "Secure 1-click login", icon: <Shield size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
          ]}
        />
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────────── */}
      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 36, paddingBottom: 80, width: "100%" }}>

        {/* STAFF BY ROLE GRID */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14, ease: EASE }}
          className="flex flex-wrap md:flex-nowrap items-stretch w-full"
          style={{ gap: 16, marginBottom: 36 }}
        >
          {roleStats.map((s, _i) => {
            const c = ROLE_COLORS[s.role] ?? { bg: "rgba(139,112,96,0.10)", text: T.taupe, border: "rgba(139,112,96,0.15)" };
            const Icon = ROLE_ICONS[s.role] ?? Users;
            return (
              <div
                key={s.role}
                className="flex-1 min-w-[150px]"
                style={{
                  background: "#FFF",
                  border: `1.5px solid ${T.antiqueGold}`,
                  borderRadius: 16,
                  padding: "18px 20px",
                  boxShadow: "0 2px 12px rgba(44,24,16,0.05)",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                {/* Left: Icon Box */}
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon size={20} color={c.text} />
                </div>

                {/* Right Column: Role Label -> Large Count -> Subtext */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{
                    fontFamily: F.ui,
                    fontWeight: 700,
                    fontSize: 12,
                    color: T.luxuryBrown,
                    letterSpacing: "0.4px",
                    lineHeight: 1.2,
                  }}>
                    {s.role}
                  </div>

                  <div style={{
                    fontFamily: F.display,
                    fontWeight: 700,
                    fontSize: 28,
                    color: c.text,
                    lineHeight: 1.05,
                  }}>
                    {s.count}
                  </div>

                  {s.role === "Admin" ? (
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, whiteSpace: "nowrap" }}>
                      {s.fullAccess} Full · {s.semiAccess} Semi
                    </div>
                  ) : (
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, whiteSpace: "nowrap" }}>
                      {s.active} active
                    </div>
                  )}
                </div>
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
            setEditingRow={row => { setRowSaveError(null); setEditingRow(row); }}
            setViewingRow={setViewingRow}
            cardStyle={cardStyle}
            inputStyle={inputStyle}
            loading={loading}
            loadError={!!loadError}
            onRetry={() => void loadUsers()}
            isFiltered={searchQ.trim() !== "" || roleFilter !== "All Roles"}
            onClearFilters={() => { setSearchQ(""); setRoleFilter("All Roles"); }}
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
        {viewingRow && (
          <ViewUserModal
            key="view-row"
            row={viewingRow}
            onClose={() => setViewingRow(null)}
            onEdit={() => { setRowSaveError(null); setEditingRow(viewingRow); setViewingRow(null); }}
          />
        )}
        {editingRow && (
          <EditUserModal
            key="edit-row"
            row={editingRow}
            saving={rowSaving}
            error={rowSaveError}
            onClose={() => { if (!rowSaving) { setEditingRow(null); setRowSaveError(null); } }}
            onSave={updates => void handleSaveRow(editingRow, updates)}
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
