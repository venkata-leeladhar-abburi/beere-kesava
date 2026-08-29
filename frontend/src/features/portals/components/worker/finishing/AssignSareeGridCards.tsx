import React from "react";
import { PersonGroupGrid, BatchGroupGrid, READY_PILL } from "./FinishingGroupGrid";
import { type FinishingTableRow } from "./FinishingSareeTable";

export interface WeaverGroup { name: string; rows: FinishingTableRow[]; }
export interface BatchGroup { id: string; rows: FinishingTableRow[]; }

function producerOf(r: FinishingTableRow) {
  return r.detail?.producerName ?? (r.fallbackProducer && r.fallbackProducer !== "—" ? r.fallbackProducer : "Unassigned");
}

// ── Weaver / factory-loom cards for the Assign queue.
export function AssignWeaverGrid({ groups, onSelect, isDesktop, isTablet }: {
  groups: WeaverGroup[]; onSelect: (name: string) => void; isDesktop?: boolean; isTablet?: boolean;
}) {
  return (
    <PersonGroupGrid
      groups={groups} onSelect={onSelect} isDesktop={isDesktop} isTablet={isTablet}
      badgeWord="ready" badgeStyle={READY_PILL}
      gradient="linear-gradient(100deg, #3D0E1A 0%, #6E0F2D 100%)"
    />
  );
}

// ── Batch cards for the Assign queue.
export function AssignBatchGrid({ groups, onSelect, isDesktop, isTablet }: {
  groups: BatchGroup[]; onSelect: (id: string) => void; isDesktop?: boolean; isTablet?: boolean;
}) {
  return (
    <BatchGroupGrid
      groups={groups} onSelect={onSelect} isDesktop={isDesktop} isTablet={isTablet}
      badgeWord="ready" badgeStyle={READY_PILL}
      secondaryLabel={rows => {
        const names = Array.from(new Set(rows.map(producerOf)));
        return names.length === 1 ? names[0] : `${names.length} weavers / looms`;
      }}
    />
  );
}
