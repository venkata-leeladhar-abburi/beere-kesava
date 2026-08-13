import React, { useState } from "react";
import { T } from "./audit-log/tokens";
import { PageHeaderStats } from "./audit-log/PageHeaderStats";
import { LiveFilterBar } from "./audit-log/LiveFilterBar";
import { ActionLogSection } from "./audit-log/ActionLogSection";
import { LoginHistorySection } from "./audit-log/LoginHistorySection";
import { NoticeFooter } from "./audit-log/NoticeFooter";

export function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [moduleFilter, setModuleFilter] = useState("All Modules");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [periodFilter, setPeriodFilter] = useState("All Time");

  return (
    <div style={{ background: T.silkCream, minHeight: "100dvh", fontFamily: "'Inter', sans-serif" }}>
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
      />
      <LoginHistorySection />
      <NoticeFooter />
    </div>
  );
}
