import React, { useState } from "react";
import { Edit2, ShieldOff, ShieldCheck, Eye, Trash2, ChevronLeft, ChevronRight, Users, LayoutGrid, LayoutList } from "lucide-react";
import { DateFilterBar, DateFilterState } from "../../../shared/ui/DateFilterBar";
import { T, F, ROLES } from "./theme";
import { TableRow } from "./utils";
import { SectionCard, RoleBadge, AccessBadge, StatusBadge } from "./UserBadges";
import { FinishingStaffMember } from "@/features/finishing";
import { Button, IconButton, SearchInput, Select, SelectItem } from "../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../shared/ui/data";
import { Pagination } from "../../../shared/ui/DataPagination";

interface UserTableProps {
  allRows: TableRow[];
  searchQ: string;
  setSearchQ: (q: string) => void;
  roleFilter: string;
  setRoleFilter: (r: string) => void;
  dateFilter: DateFilterState;
  setDateFilter: (f: DateFilterState) => void;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  pagedRows: TableRow[];
  filtered: TableRow[];
  totalPages: number;
  ROWS_PER_PAGE: number;
  onToggleStatus: (row: TableRow) => void;
  onDelete: (row: TableRow) => void;
  setEditingMember: (m: FinishingStaffMember | null) => void;
  setViewingMember: (m: FinishingStaffMember | null) => void;
  setEditingRow: (r: TableRow | null) => void;
  setViewingRow: (r: TableRow | null) => void;
  cardStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;
  loading?: boolean;
  loadError?: boolean;
  onRetry?: () => void;
  isFiltered?: boolean;
  onClearFilters?: () => void;
}

export const userTableColumns = ({
  setEditingMember,
  onToggleStatus,
  onDelete,
  setViewingMember,
  setEditingRow,
  setViewingRow,
}: {
  setEditingMember: (m: FinishingStaffMember | null) => void;
  onToggleStatus: (row: TableRow) => void;
  onDelete: (row: TableRow) => void;
  setViewingMember: (m: FinishingStaffMember | null) => void;
  setEditingRow: (r: TableRow | null) => void;
  setViewingRow: (r: TableRow | null) => void;
}): ColumnDef<TableRow>[] => [
  {
    id: "employee",
    header: "Employee",
    priority: 1,
    accessor: (row) => row.firstName,
    cell: (_, row) => (
      <div>
        <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: T.luxuryBrown }}>
          {row.firstName} {row.lastName}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: T.taupe, marginTop: 2 }}>
          {row.empId}
        </div>
      </div>
    ),
  },
  {
    id: "role",
    header: "Role & Access",
    accessor: (row) => row.role,
    cell: (_, row) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
        <RoleBadge role={row.role} />
        {row.accessLevel && <AccessBadge level={row.accessLevel} />}
      </div>
    ),
  },
  {
    id: "contact",
    header: "Contact",
    accessor: (row) => row.mobile,
    cell: (_, row) => (
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.luxuryBrown }}>
        +91 {row.mobile}
      </div>
    ),
  },
  {
    id: "portal",
    header: "Portal",
    priority: 3,
    accessor: (row) => row.portal,
    cell: (_, row) => (
      <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
        {row.portal}
      </div>
    ),
  },
  {
    id: "dateAdded",
    header: "Date Added",
    priority: 3,
    accessor: (row) => row.dateAdded,
    cell: (_, row) => (
      <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
        {row.dateAdded}
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    accessor: (row) => row.status,
    cell: (_, row) => (
      <StatusBadge status={row.status} />
    ),
  },
  {
    id: "actions",
    header: "",
    accessor: (row) => row.empId,
    cell: (_, row) => (
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        {row.finishingMember ? (
          <>
            <IconButton label="View profile" icon={Eye} size="sm" onClick={() => setViewingMember(row.finishingMember!)} />
            <IconButton label="Edit" icon={Edit2} size="sm" onClick={() => setEditingMember(row.finishingMember!)} />
          </>
        ) : (
          <>
            <IconButton label="View profile" icon={Eye} size="sm" onClick={() => setViewingRow(row)} />
            <IconButton label="Edit" icon={Edit2} size="sm" onClick={() => setEditingRow(row)} />
          </>
        )}
        <IconButton
          label={row.status === "Active" ? "Deactivate" : "Activate"}
          icon={row.status === "Active" ? ShieldOff : ShieldCheck}
          size="sm"
          onClick={() => onToggleStatus(row)}
        />
        <IconButton label="Delete" icon={Trash2} size="sm" variant="danger" onClick={() => onDelete(row)} />
      </div>
    ),
  },
];

export function UserTable({
  allRows, searchQ, setSearchQ, roleFilter, setRoleFilter,
  dateFilter, setDateFilter, page, setPage, pagedRows, filtered,
  totalPages, ROWS_PER_PAGE, onToggleStatus, onDelete,
  setEditingMember, setViewingMember, setEditingRow, setViewingRow,
  loading, loadError, onRetry, isFiltered, onClearFilters,
}: UserTableProps) {
  const [userView, setUserView] = useState<"card" | "table">("card");

  return (
    <SectionCard
      icon={Users}
      title="All Users"
      subtitle={`${allRows.length} user${allRows.length === 1 ? "" : "s"} registered across all roles and portals.`}
      actions={
        <>
          {/* Quick-filter pills */}
          <div style={{ display: "flex", gap: 6 }}>
            {["All Roles", "Finishing Staff"].map(pill => (
              <Button key={pill} size="sm"
                variant={roleFilter === pill ? "secondary" : "tertiary"}
                onClick={() => { setRoleFilter(pill); setPage(1); }}
                className={roleFilter === pill ? "" : "bg-white/10 text-[#FFFDF9] border-white/20 hover:bg-white/20 hover:text-white"}
              >{pill}</Button>
            ))}
          </div>
          {/* Search */}
          <SearchInput aria-label="Search users" value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(1); }} placeholder="Search users…" containerClassName="w-[220px]" />
          {/* Role filter dropdown */}
          <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }} className="w-[170px]">
            <SelectItem value="All Roles">All Roles</SelectItem>
            {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </Select>
        </>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <DateFilterBar filter={dateFilter} onChange={f => { setDateFilter(f); setPage(1); }} />
      </div>

      {/* Mobile-only View Switcher */}
      <div className="md:hidden flex justify-end mb-4">
        <div style={{ display: "inline-flex", alignItems: "center", background: "#FFFFFF", border: `1.5px solid ${T.borderDef}`, borderRadius: 999, padding: 3, gap: 2 }}>
          <button
            type="button"
            onClick={() => setUserView("card")}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999,
              fontFamily: F.ui, fontSize: 13, fontWeight: 600,
              background: userView === "card" ? "#6E0F2D" : "transparent",
              color: userView === "card" ? "#FFFFFF" : T.taupe,
              border: "none",
              boxShadow: userView === "card" ? "0 2px 8px rgba(110,15,45,0.25)" : "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <LayoutGrid size={15} color={userView === "card" ? "#FFFFFF" : T.taupe} />
            Card View
          </button>
          <button
            type="button"
            onClick={() => setUserView("table")}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999,
              fontFamily: F.ui, fontSize: 13, fontWeight: 600,
              background: userView === "table" ? "#6E0F2D" : "transparent",
              color: userView === "table" ? "#FFFFFF" : T.taupe,
              border: "none",
              boxShadow: userView === "table" ? "0 2px 8px rgba(110,15,45,0.25)" : "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <LayoutList size={15} color={userView === "table" ? "#FFFFFF" : T.taupe} />
            Table View
          </button>
        </div>
      </div>

      {/* Mobile Card View */}
      {userView === "card" && (
        <div className="md:hidden flex flex-col gap-4 mb-4">
          {pagedRows.map(row => (
            <div key={row.empId} style={{ background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 2px 10px rgba(74,6,27,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 16, color: T.luxuryBrown }}>{row.firstName} {row.lastName}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, marginTop: 2 }}>{row.empId}</div>
                </div>
                <StatusBadge status={row.status} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, fontFamily: F.ui }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: T.taupe }}>Role & Access</span>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <RoleBadge role={row.role} />
                    {row.accessLevel && <AccessBadge level={row.accessLevel} />}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: T.taupe }}>Contact</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: T.luxuryBrown }}>+91 {row.mobile}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: T.taupe }}>Portal</span>
                  <span style={{ color: T.taupe }}>{row.portal}</span>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                {row.finishingMember ? (
                  <>
                    <IconButton label="View profile" icon={Eye} size="sm" onClick={() => setViewingMember(row.finishingMember!)} />
                    <IconButton label="Edit" icon={Edit2} size="sm" onClick={() => setEditingMember(row.finishingMember!)} />
                  </>
                ) : (
                  <>
                    <IconButton label="View profile" icon={Eye} size="sm" onClick={() => setViewingRow(row)} />
                    <IconButton label="Edit" icon={Edit2} size="sm" onClick={() => setEditingRow(row)} />
                  </>
                )}
                <IconButton
                  label={row.status === "Active" ? "Deactivate" : "Activate"}
                  icon={row.status === "Active" ? ShieldOff : ShieldCheck}
                  size="sm"
                  onClick={() => onToggleStatus(row)}
                />
                <IconButton label="Delete" icon={Trash2} size="sm" variant="danger" onClick={() => onDelete(row)} />
              </div>
            </div>
          ))}
          {pagedRows.length === 0 && (
            <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 48, textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
              No users found matching your filters.
            </div>
          )}
        </div>
      )}

      {/* Table View (Mobile Table view mode or Desktop default) */}
      <div className={userView === "table" ? "w-full overflow-x-auto section-nav-scroll" : "hidden md:block w-full overflow-x-auto section-nav-scroll"}>
        <div className="min-w-[850px]">
          <DataTable
            responsive={false}
            columns={userTableColumns({ setEditingMember, onToggleStatus, onDelete, setViewingMember, setEditingRow, setViewingRow })}
            data={pagedRows}
            getRowId={(u) => u.empId}
            loading={loading}
            error={loadError}
            onRetry={onRetry}
            isFiltered={isFiltered}
            onClearFilters={onClearFilters}
            emptyTitle={isFiltered ? "No users match your filters" : "No users yet"}
            emptyDescription={isFiltered ? undefined : "Employees added here will show up in this table."}
          />
        </div>
      </div>

      {/* Pagination */}
      <div style={{ margin: "16px -28px -28px", padding: "8px 28px 16px", borderTop: `1px solid ${T.borderDef}` }}>
        <Pagination
          page={page}
          pageCount={totalPages}
          total={filtered.length}
          pageSize={ROWS_PER_PAGE}
          start={(page - 1) * ROWS_PER_PAGE}
          onPageChange={p => setPage(p)}
          itemLabel="users"
        />
      </div>
    </SectionCard>
  );
}
