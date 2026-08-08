import React from "react";
import { Edit2, ShieldOff, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { DateFilterBar, DateFilterState } from "../../../shared/ui/DateFilterBar";
import { T, F, ROLE_COLORS, ROLES } from "./theme";
import { TableRow } from "./utils";
import { SectionTitle, RoleBadge, AccessBadge, StatusBadge } from "./UserBadges";
import { FinishingStaffMember } from "../../finishing/contexts/FinishingStaffContext";
import { Button, IconButton, SearchInput, Select, SelectItem } from "../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../shared/ui/data";

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
  cardStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;
}

export const userTableColumns = ({
  setEditingMember,
  onToggleStatus,
  onDelete,
  setViewingMember,
}: {
  setEditingMember: (m: FinishingStaffMember | null) => void;
  onToggleStatus: (row: TableRow) => void;
  onDelete: (row: TableRow) => void;
  setViewingMember: (m: FinishingStaffMember | null) => void;
}): ColumnDef<TableRow>[] => [
  {
    id: "employee",
    header: "Employee",
    accessor: (row) => row.firstName,
    cell: (_, row) => (
      <div>
        <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: T.luxuryBrown }}>
          {row.firstName} {row.lastName}
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginTop: 2 }}>
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
      <div style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown }}>
        +91 {row.mobile}
      </div>
    ),
  },
  {
    id: "portal",
    header: "Portal",
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
        {row.role === "Finishing Staff" && row.finishingMember ? (
          <>
            <IconButton label="View profile" icon={Eye} size="sm" onClick={() => setViewingMember(row.finishingMember!)} />
            <IconButton label="Edit" icon={Edit2} size="sm" onClick={() => setEditingMember(row.finishingMember!)} />
          </>
        ) : null}
        <IconButton
          label={row.status === "Active" ? "Deactivate" : "Activate"}
          icon={ShieldOff}
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
  setEditingMember, setViewingMember, cardStyle, inputStyle
}: UserTableProps) {
  return (
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
              <Button key={pill} size="sm"
                variant={roleFilter === pill ? "secondary" : "tertiary"}
                onClick={() => { setRoleFilter(pill); setPage(1); }}
              >{pill}</Button>
            ))}
          </div>
          {/* Search */}
          <SearchInput value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(1); }} placeholder="Search users…" containerClassName="w-[220px]" />
          {/* Role filter dropdown */}
          <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }} className="w-[170px]">
            <SelectItem value="All Roles">All Roles</SelectItem>
            {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </Select>
        </div>
      </div>

      <div style={{ padding: "0 28px 16px" }}>
        <DateFilterBar filter={dateFilter} onChange={f => { setDateFilter(f); setPage(1); }} />
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" as const, minWidth: 1040 }}>
        <DataTable
          columns={userTableColumns({ setEditingMember, onToggleStatus, onDelete, setViewingMember })}
          data={pagedRows}
          getRowId={(u) => u.empId}
          emptyTitle="No users found matching your filters."
        />
      </div>

      {/* Pagination */}
      <div style={{ padding: "16px 28px", borderTop: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
          Showing {Math.min((page - 1) * ROWS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ROWS_PER_PAGE, filtered.length)} of {filtered.length} users
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <IconButton label="Previous page" size="sm" variant="tertiary"
            icon={ChevronLeft} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} />
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
            <Button key={pg} size="sm" variant={pg === page ? "primary" : "tertiary"} onClick={() => setPage(pg)}
            >{pg}</Button>
          ))}
          <IconButton label="Next page" size="sm" variant="tertiary"
            icon={ChevronRight} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
        </div>
      </div>
    </div>
  );
}
