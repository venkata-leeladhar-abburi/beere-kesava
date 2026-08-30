import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { T } from "./audit-log/tokens";
import { PageHeaderStats } from "./audit-log/PageHeaderStats";
import { LiveFilterBar } from "./audit-log/LiveFilterBar";
import { ActionLogSection } from "./audit-log/ActionLogSection";
import { LoginHistorySection } from "./audit-log/LoginHistorySection";
import { NoticeFooter } from "./audit-log/NoticeFooter";
import { usersApi, type BackendRole } from "../../../shared/api/users";
import { useAuthGate } from "../../../contexts/AuthContext";

const DEFAULT_ROLE = "All Roles";
const DEFAULT_STAFF = "All Staff";
const DEFAULT_MODULE = "All Modules";
const DEFAULT_ACTION = "All Actions";
const DEFAULT_PERIOD = "All Time";

// Maps this page's role-filter labels to the backend UserRole they're
// actually stored as. "FINISHING STAFF" has no backend User equivalent
// (FinishingStaff is a separate domain table) — omitted on purpose, so the
// staff dropdown just stays empty for that role rather than showing decoys.
const ROLE_FILTER_TO_BACKEND: Record<string, BackendRole> = {
  SUPERADMIN: "SUPERADMIN",
  ADMIN: "ADMIN",
  "WORKER STAFF": "WORKER",
  "SHOP STAFF": "SHOP",
};

export function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilterRaw] = useState(DEFAULT_ROLE);
  const [staffFilter, setStaffFilter] = useState(DEFAULT_STAFF);
  const [moduleFilter, setModuleFilter] = useState(DEFAULT_MODULE);
  const [actionFilter, setActionFilter] = useState(DEFAULT_ACTION);
  const [periodFilter, setPeriodFilter] = useState(DEFAULT_PERIOD);

  // Switching role invalidates whichever staff member was selected under the
  // previous role — a stale staff id from another role must not keep filtering.
  const setRoleFilter = (v: string) => {
    setRoleFilterRaw(v);
    setStaffFilter(DEFAULT_STAFF);
  };

  const { data: staffData } = useQuery({
    queryKey: ["audit-log", "staff-directory"],
    queryFn: () => usersApi.list({ pageSize: 200 }),
    enabled: useAuthGate("admin", "superadmin"),
  });

  const staffOptions = useMemo(() => {
    const backendRole = ROLE_FILTER_TO_BACKEND[roleFilter];
    const users = staffData?.items ?? [];
    const scoped = roleFilter === DEFAULT_ROLE ? users : users.filter(u => u.role === backendRole);
    return scoped.map(u => ({ id: u.id, label: `${u.firstName} ${u.lastName}` }));
  }, [staffData, roleFilter]);

  const isFiltered =
    search.trim() !== "" ||
    roleFilter !== DEFAULT_ROLE ||
    staffFilter !== DEFAULT_STAFF ||
    moduleFilter !== DEFAULT_MODULE ||
    actionFilter !== DEFAULT_ACTION ||
    periodFilter !== DEFAULT_PERIOD;

  const clearFilters = () => {
    setSearch("");
    setRoleFilterRaw(DEFAULT_ROLE);
    setStaffFilter(DEFAULT_STAFF);
    setModuleFilter(DEFAULT_MODULE);
    setActionFilter(DEFAULT_ACTION);
    setPeriodFilter(DEFAULT_PERIOD);
  };

  const staffUserId = staffFilter !== DEFAULT_STAFF ? staffFilter : undefined;

  return (
    <div style={{ background: T.silkCream, minHeight: "100dvh", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" }}>
      <PageHeaderStats />

      {/* Section wrapper — clears stats strip */}
      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 96 }}>
        <LiveFilterBar
          search={search} setSearch={setSearch}
          roleFilter={roleFilter} setRoleFilter={setRoleFilter}
          staffFilter={staffFilter} setStaffFilter={setStaffFilter} staffOptions={staffOptions}
          moduleFilter={moduleFilter} setModuleFilter={setModuleFilter}
          actionFilter={actionFilter} setActionFilter={setActionFilter}
          periodFilter={periodFilter} setPeriodFilter={setPeriodFilter}
        />
      </div>

      <ActionLogSection
        search={search}
        roleFilter={roleFilter}
        staffUserId={staffUserId}
        moduleFilter={moduleFilter}
        actionFilter={actionFilter}
        periodFilter={periodFilter}
        isFiltered={isFiltered}
        onClearFilters={clearFilters}
      />
      <LoginHistorySection staffUserId={staffUserId} />
      <div style={{ marginTop: "auto" }}>
        <NoticeFooter />
      </div>
    </div>
  );
}
