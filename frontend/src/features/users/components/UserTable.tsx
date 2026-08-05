import React from "react";
import { Edit2, ShieldOff, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { DateFilterBar, DateFilterState } from "../../../shared/ui/DateFilterBar";
import { T, F, ROLE_COLORS, ROLES } from "./theme";
import { TableRow } from "./utils";
import { SectionTitle, RoleBadge, AccessBadge, StatusBadge } from "./UserBadges";
import { FinishingStaffMember } from "../../finishing/contexts/FinishingStaffContext";
import { Button, IconButton, SearchInput, Select, SelectItem } from "../../../shared/ui/primitives";

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
  setEditingMember: (m: FinishingStaffMember | null) => void;
  setViewingMember: (m: FinishingStaffMember | null) => void;
  cardStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;
}

export function UserTable({
  allRows, searchQ, setSearchQ, roleFilter, setRoleFilter,
  dateFilter, setDateFilter, page, setPage, pagedRows, filtered,
  totalPages, ROWS_PER_PAGE, onToggleStatus,
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
      <div style={{ overflowX: "auto" as const }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 140px 130px 160px 1fr 110px 90px 170px", gap: 0, padding: "10px 28px", background: "rgba(110,15,45,0.03)", borderTop: `1px solid ${T.borderDef}`, borderBottom: `1px solid ${T.borderDef}`, minWidth: 980 }}>
          {["Emp ID", "Full Name", "Role", "Access", "Mobile Number", "Portal Access", "Date Added", "Status", "Actions"].map(col => (
            <div key={col} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{col}</div>
          ))}
        </div>

        {/* Rows */}
        {pagedRows.length === 0 ? (
          <div style={{ padding: "40px 28px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No users found matching your filters.</div>
        ) : pagedRows.map((u, i) => {
          const fm = u.finishingMember;
          return (
            <div key={u.empId + i}
              style={{ display: "grid", gridTemplateColumns: "100px 1fr 140px 130px 160px 1fr 110px 90px 170px", gap: 0, padding: "15px 28px", borderBottom: i < pagedRows.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 0 ? "#fff" : "rgba(247,242,234,0.40)", alignItems: "center", minWidth: 980, transition: "background 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(110,15,45,0.025)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = i % 2 === 0 ? "#fff" : "rgba(247,242,234,0.40)"; }}
            >
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>{u.empId}</div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${ROLE_COLORS[u.role]?.text ?? T.taupe}, ${T.darkBurgundy})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, color: "#FFF" }}>{u.firstName[0]}{u.lastName[0]}</span>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{u.firstName} {u.lastName}</div>
                  {fm?.specialisation && (
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.blue, marginTop: 1 }}>{fm.specialisation}</div>
                  )}
                </div>
              </div>

              <div><RoleBadge role={u.role} /></div>
              <div>{u.accessLevel ? <AccessBadge level={u.accessLevel} /> : <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(139,112,96,0.45)" }}>—</span>}</div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{u.mobile}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{u.portal}</div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{u.dateAdded}</div>
              <div><StatusBadge status={u.status} /></div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 5 }}>
                <Button size="sm" variant="tertiary" iconLeft={Edit2}
                  onClick={() => fm && setEditingMember(fm)}
                >Edit</Button>
                <Button size="sm" variant="danger-subtle" iconLeft={ShieldOff}
                  onClick={() => onToggleStatus(u)}
                >{u.status === "Active" ? "Deactivate" : "Activate"}</Button>
                {fm && (
                  <Button size="sm" variant="tertiary" iconLeft={Eye}
                    onClick={() => setViewingMember(fm)}
                  >View</Button>
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
