import React, { useState } from "react";
import { T } from "./audit-log/tokens";
import { PageHeaderStats } from "./audit-log/PageHeaderStats";
import { LiveFilterBar } from "./audit-log/LiveFilterBar";
import { ActionLogSection } from "./audit-log/ActionLogSection";
import { LoginHistorySection } from "./audit-log/LoginHistorySection";
import { NoticeFooter } from "./audit-log/NoticeFooter";

const DEFAULT_ROLE = "All Roles";
const DEFAULT_MODULE = "All Modules";
const DEFAULT_ACTION = "All Actions";
const DEFAULT_PERIOD = "All Time";

export function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(DEFAULT_ROLE);
  const [moduleFilter, setModuleFilter] = useState(DEFAULT_MODULE);
  const [actionFilter, setActionFilter] = useState(DEFAULT_ACTION);
  const [periodFilter, setPeriodFilter] = useState(DEFAULT_PERIOD);

  const isFiltered =
    search.trim() !== "" ||
    roleFilter !== DEFAULT_ROLE ||
    moduleFilter !== DEFAULT_MODULE ||
    actionFilter !== DEFAULT_ACTION ||
    periodFilter !== DEFAULT_PERIOD;

  const clearFilters = () => {
    setSearch("");
    setRoleFilter(DEFAULT_ROLE);
    setModuleFilter(DEFAULT_MODULE);
    setActionFilter(DEFAULT_ACTION);
    setPeriodFilter(DEFAULT_PERIOD);
  };

  return (
    <div style={{ background: T.silkCream, minHeight: "100dvh", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" }}>
      <PageHeaderStats />

      {/* Section wrapper — clears stats strip */}
      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 96 }}>
        <LiveFilterBar
          search={search} setSearch={setSearch}
          roleFilter={roleFilter} setRoleFilter={setRoleFilter}
          moduleFilter={moduleFilter} setModuleFilter={setModuleFilter}
          actionFilter={actionFilter} setActionFilter={setActionFilter}
          periodFilter={periodFilter} setPeriodFilter={setPeriodFilter}
        />
      </div>

      <ActionLogSection
        search={search}
        roleFilter={roleFilter}
        moduleFilter={moduleFilter}
        actionFilter={actionFilter}
        periodFilter={periodFilter}
        isFiltered={isFiltered}
        onClearFilters={clearFilters}
      />
      <LoginHistorySection />
      <div style={{ marginTop: "auto" }}>
        <NoticeFooter />
      </div>
    </div>
  );
}
