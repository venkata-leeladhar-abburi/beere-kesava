import React from "react";
import { PersonGroupGrid, BatchGroupGrid, AWAITING_PILL } from "./FinishingGroupGrid";
import { type FinishingTableRow } from "./FinishingSareeTable";

export interface StaffGroup { name: string; rows: FinishingTableRow[]; }
export interface BatchGroup { id: string; rows: FinishingTableRow[]; }

// ── Finishing-staff cards for the Receive-back queue.
export function ReceiveStaffGrid({ groups, onSelect, isDesktop, isTablet }: {
  groups: StaffGroup[]; onSelect: (name: string) => void; isDesktop?: boolean; isTablet?: boolean;
}) {
  return (
    <PersonGroupGrid
      groups={groups} onSelect={onSelect} isDesktop={isDesktop} isTablet={isTablet}
      badgeWord="awaiting" badgeStyle={AWAITING_PILL}
      gradient="linear-gradient(100deg, #15603D 0%, #1F774E 100%)"
    />
  );
}

// ── Batch cards for the Receive-back queue.
export function ReceiveBatchGrid({ groups, onSelect, isDesktop, isTablet }: {
  groups: BatchGroup[]; onSelect: (id: string) => void; isDesktop?: boolean; isTablet?: boolean;
}) {
  return (
    <BatchGroupGrid
      groups={groups} onSelect={onSelect} isDesktop={isDesktop} isTablet={isTablet}
      badgeWord="awaiting" badgeStyle={AWAITING_PILL}
      secondaryLabel={rows => {
        const names = Array.from(new Set(rows.map(r => r.staffName).filter(Boolean) as string[]));
        return names.length === 1 ? names[0] : `${names.length} finishing staff`;
      }}
    />
  );
}
